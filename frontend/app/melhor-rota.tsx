import { BackgroundGradient } from "../src/components/BackgroundGradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackButton } from "../src/components/BackButton";
import { ListenOptionsButton } from "../src/components/ListenOptionsButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { RouteStep } from "../src/components/RouteStep";
import Map from "../src/components/Map";
import { LiquidGlassView } from "../src/components/LiquidGlassView";
import { LinearGradient } from "expo-linear-gradient";
import { AdaptiveIcon } from "../src/components/AdaptiveIcon";
import { useThemeColors } from "../src/theme/colors";
import { journeyService } from "../src/services/journey.service";
import { sessionService } from "../src/services/session.service";
import { vibrationService } from "../src/services/vibration.service";
import { speak } from "../src/services/speech.service";
import { trackingService } from "../src/services/tracking.service";
import { isConnected } from "../src/utils/network";
import { JourneyStep, JourneySummary, MapFocusMode } from "../src/types/journey.types";
import { formatMinutesToFriendlyText } from "../src/utils/date-time";
import { parseJsonParam, calculateDistance } from "../src/utils/helpers";


function getTransitSteps(steps: JourneyStep[]) {
  return steps.filter((step) => step.type === "transit");
}

function getShortStopName(stopName: string) {
  if (!stopName) {
    return "Ponto próximo";
  }
  return stopName.split(",")[0].trim();
}

function buildShortMessage({
  transitSteps,
  stopName,
  leaveHomeText,
  beAtStopText,
}: {
  transitSteps: JourneyStep[];
  stopName: string;
  leaveHomeText: string;
  beAtStopText: string;
}) {
  const buses = transitSteps
    .filter((step) => step.type === "transit")
    .map((step) => step.line);

  if (buses.length === 0) {
    return "Você pode ir andando até o seu destino.";
  }

  if (buses.length === 1) {
    const whenToLeave = leaveHomeText ? `Saia ${leaveHomeText}.` : "Saia agora.";
    const busInfo = beAtStopText ? `Pegue o ônibus ${buses[0]} às ${beAtStopText.replace("às ", "")}.` : `Pegue o ônibus ${buses[0]}.`;
    return `${whenToLeave} Caminhe até o ponto ${stopName}. ${busInfo}`;
  }

  return `Encontrei uma rota com ${buses.length} ônibus. Primeiro, pegue o ônibus ${buses[0]} ${beAtStopText}. Depois eu te aviso onde trocar.`;
}

function buildVoiceSummary({
  busLine,
  departureTime,
  arrivalTime,
}: {
  busLine: string;
  departureTime: string;
  arrivalTime: string;
}) {
  const linePart = busLine ? `Você vai pegar a linha ${busLine}. ` : "";
  const departurePart = departureTime ? `O ônibus sai ${departureTime.replace("às ", "às ")}. ` : "";
  const arrivalPart = arrivalTime ? `A chegada prevista é às ${arrivalTime}. ` : "";
  
  return `Encontrei uma rota. ${linePart}${departurePart}${arrivalPart}Quer iniciar a navegação?`;
}

export default function BestRouteScreen() {
  const params = useLocalSearchParams();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  
  const latitude = String(params.latitude || "");
  const longitude = String(params.longitude || "");
  const mapParam = String(params.map || "");
  const destination = String(params.destination || "seu destino");
  const destinationLat = String(params.destinationLat || "");
  const destinationLng = String(params.destinationLng || "");
  const selectedDestination = String(params.selectedDestination || "");
  const fullBackendMessage = String(params.message || "");


  const summary = parseJsonParam<any>(params.summary, null);
  const alerts = parseJsonParam<string[]>(params.alerts, []);
  const steps = parseJsonParam<JourneyStep[]>(params.steps, []);
  const mapData = parseJsonParam<any>(params.map, undefined);
  const rawAlternatives = useMemo(() => parseJsonParam<any[]>(params.alternatives, []), [params.alternatives]);
  const isDark = useColorScheme() === 'dark';

  // Monta a lista completa de rotas selecionáveis
  const allRoutes = useMemo(() => {
    const main = {
      tag: summary?.tag || "Recomendada",
      summary,
      steps,
      map: mapData,
      alerts,
    };
    if (!rawAlternatives || rawAlternatives.length === 0) return [main];
    return [
      main,
      ...rawAlternatives.map((alt, i) => ({
        tag: alt.summary?.tag || `Opção ${i + 2}`,
        summary: alt.summary,
        steps: alt.steps || [],
        map: alt.map,
        alerts: alt.alerts || [],
      })),
    ];
  }, [summary, steps, mapData, alerts, rawAlternatives]);

  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const currentRoute = allRoutes[selectedRouteIndex] || allRoutes[0];
  const activeSummary = currentRoute.summary;
  const activeSteps = currentRoute.steps || [];
  const activeMapData = currentRoute.map || mapData;
  const activeAlerts = currentRoute.alerts || [];

  const [isLoadingCommand, setIsLoadingCommand] = useState(false);
  const [liveBusPosition, setLiveBusPosition] = useState<{lat: number, lng: number, heading?: number} | null>(null);
  const [mapFocusMode, setMapFocusMode] = useState<MapFocusMode>('full_route');

  const transitSteps = getTransitSteps(activeSteps);
  const firstTransitStep = transitSteps[0];
  const isWalkingOnly = transitSteps.length === 0;

  const stopName =
    firstTransitStep?.type === "transit"
      ? getShortStopName(firstTransitStep.from)
      : "Ponto próximo";

  const busLine =
    firstTransitStep?.type === "transit"
      ? firstTransitStep.line
      : activeSummary?.busLines?.[0] || "";

  const direction =
    firstTransitStep?.type === "transit"
      ? (firstTransitStep.headsign || firstTransitStep.to || "")
      : "";

  // Busca a posição comunitária do ônibus a cada 5 segundos
  useEffect(() => {
    if (isWalkingOnly || !busLine) return;
    
    const fetchBus = async () => {
      const data = await trackingService.getBusPosition(busLine, direction || undefined);
      if (data && data.lat && data.lng) {
        setLiveBusPosition({ lat: data.lat, lng: data.lng, heading: data.bearing });
      } else {
        setLiveBusPosition(null);
      }
    };
    
    fetchBus();
    const interval = setInterval(fetchBus, 5000);
    return () => clearInterval(interval);
  }, [isWalkingOnly, busLine, direction]);

  const liveBusDistanceText = useMemo(() => {
    if (!liveBusPosition || !latitude || !longitude) return null;
    const userLat = Number(latitude);
    const userLng = Number(longitude);
    if (!userLat || !userLng) return null;
    const distMeters = calculateDistance(userLat, userLng, liveBusPosition.lat, liveBusPosition.lng);
    if (distMeters < 1000) {
      return `${Math.round(distMeters)}m de você`;
    }
    return `${(distMeters / 1000).toFixed(1)}km de você`;
  }, [liveBusPosition, latitude, longitude]);

  const leaveHomeText = activeSummary?.leaveHomeText || "";
  const beAtStopText = activeSummary?.beAtStopText || "";
  const initialWalkTimeMin = activeSummary?.initialWalkTimeMin ?? 0;
  const totalDurationMin = activeSummary?.totalDurationMin ?? 0;

  const shortMessage = buildShortMessage({
    transitSteps,
    stopName,
    leaveHomeText,
    beAtStopText,
  });

  const speechTextParam = String(params.speechText || "");
  const sessionIdParam = String(params.sessionId || "");

  const baseVoiceSummary = buildVoiceSummary({
    busLine,
    departureTime: activeSummary?.beAtStopAt || activeSummary?.leaveHomeAt || "",
    arrivalTime: activeSummary?.arrivalAtDestination || "",
  });

  const voiceSummary = isWalkingOnly
    ? `Você pode ir caminhando até ${destination}. São cerca de ${formatMinutesToFriendlyText(totalDurationMin)} a pé. Quer iniciar a caminhada?`
    : baseVoiceSummary;

  const voiceText = speechTextParam || voiceSummary;

  const initialRegion = {
    latitude: Number(latitude) || -19.7472,
    longitude: Number(longitude) || -47.9392,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  async function handleGoHome() {
    setIsLoadingCommand(true);
    vibrationService.light();
    try {
      const connected = await isConnected();
      const activeSessionId = sessionIdParam || sessionService.getSessionId();
      if (connected && activeSessionId) {
        await journeyService.executeCommand({
          sessionId: activeSessionId,
          command: "CANCEL"
        });
      }
    } catch (err) {
      console.log("[BestRoute] Erro ao executar CANCEL no backend:", err);
    } finally {
      setIsLoadingCommand(false);
      sessionService.clearSessionId();
      router.replace({
        pathname: "/inicio",
        params: { latitude, longitude },
      });
    }
  }

  const handleHearRoute = useCallback(() => {
    vibrationService.selection();
    speak(voiceText);
  }, [voiceText]);

  function handleStartNavigation() {
    setIsLoadingCommand(true);
    vibrationService.success();
    router.push({
      pathname: "/navegando",
      params: {
        latitude,
        longitude,
        destination,
        destinationLat,
        destinationLng,
        selectedDestination,

        message: fullBackendMessage,
        shortMessage,
        summary: JSON.stringify(activeSummary),
        alerts: JSON.stringify(activeAlerts),
        steps: JSON.stringify(activeSteps),
        map: JSON.stringify(activeMapData),
        busLine: isWalkingOnly ? "" : busLine,
        stopName: isWalkingOnly ? destination : stopName,
        direction: isWalkingOnly
          ? ""
          : firstTransitStep?.type === "transit"
            ? firstTransitStep.headsign
            : "--",
        walkTimeMinutes: String(initialWalkTimeMin),
        ...(isWalkingOnly && { isWalkingOnly: "true" }),
      },
    });
    setTimeout(() => {
      setIsLoadingCommand(false);
    }, 1000);
  }

  // Bottom bar fixed height for padding calculation
  const bottomBarHeight = 160;

  return (
    <View style={styles.screen}>
      <BackgroundGradient />
      {/* FIXED HEADER */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8 }]}>
        <LiquidGlassView style={StyleSheet.absoluteFillObject} intensity={40} fallbackColor={theme.background} />
        <BackButton label="Início" onPress={isLoadingCommand ? undefined : handleGoHome} accessibilityLabel="Voltar para a tela inicial" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingTop: insets.top + 72, 
            paddingBottom: bottomBarHeight + insets.bottom + 24
          }
        ]}
      >
        <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
          {/* 1. CABEÇALHO E PREVIEW MAPA */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]} maxFontSizeMultiplier={1.2}>Sua melhor rota</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]} maxFontSizeMultiplier={1.1}>Para {destination}</Text>
          </View>

          {/* SELETOR DE MÚLTIPLAS ROTAS */}
          {allRoutes.length > 1 && (
            <View style={styles.routeSelectorWrapper}>
              <View style={styles.routeSelectorHeader}>
                <Ionicons name="git-branch-outline" size={18} color={theme.primary} />
                <Text style={[styles.routeSelectorTitle, { color: theme.text }]}>
                  Opções de Rota ({allRoutes.length})
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.routeSelectorScroll}
              >
                {allRoutes.map((r, idx) => {
                  const isSelected = selectedRouteIndex === idx;
                  const dur = r.summary?.totalDurationMin || 0;
                  const lineNames = r.summary?.busLines?.join(", ") || (r.summary?.isWalkingOnly ? "A pé" : "Ônibus");
                  return (
                    <TouchableOpacity
                      key={`route-opt-${idx}`}
                      onPress={() => {
                        setSelectedRouteIndex(idx);
                        vibrationService.selection();
                      }}
                      style={[
                        styles.routeCardOption,
                        isSelected
                          ? [styles.routeCardSelected, { borderColor: theme.primary }]
                          : [styles.routeCardUnselected, isDark ? { backgroundColor: "rgba(255,255,255,0.06)" } : { backgroundColor: "rgba(255,255,255,0.7)" }],
                      ]}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Opção ${r.tag}, ${dur} minutos`}
                    >
                      <View style={[styles.routeCardTag, isSelected && { backgroundColor: theme.primary }]}>
                        <Text style={[styles.routeCardTagText, isSelected && { color: "#FFFFFF" }]}>
                          {r.tag}
                        </Text>
                      </View>
                      <View style={styles.routeCardBody}>
                        <Text style={[styles.routeCardDuration, { color: isSelected ? theme.primary : theme.text }]}>
                          {dur} min
                        </Text>
                        <Text style={[styles.routeCardLines, { color: theme.textMuted }]} numberOfLines={1}>
                          {lineNames}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {activeMapData && (
            <View style={styles.previewMapContainer}>
              <Map 
                mapData={activeMapData} 
                initialRegion={initialRegion} 
                userLocation={{ latitude: Number(latitude), longitude: Number(longitude) }}
                colors={theme} 
                focusMode={mapFocusMode} 
                onFocusModeChange={setMapFocusMode}
                isNavigating={false}
                liveBusPosition={liveBusPosition}
              />
            </View>
          )}

          {/* 2. CARD DE RESUMO PRINCIPAL */}
          <View style={[styles.summaryCard, { backgroundColor: "rgba(15, 23, 42, 0.75)" }]}>
            {/* Badges do Topo */}
            <View style={styles.topBadgesRow}>
              <View style={[styles.summaryBadge, isWalkingOnly && { backgroundColor: "rgba(59,130,246,0.15)" }]}>
                {isWalkingOnly ? (
                  <FontAwesome6 name="person-walking" size={16} color="#3B82F6" />
                ) : (
                  <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                )}
                <Text style={[styles.summaryBadgeText, isWalkingOnly && { color: "#3B82F6" }]}>
                  {isWalkingOnly ? "Você pode ir a pé" : (currentRoute.tag || "Melhor rota encontrada")}
                </Text>
              </View>

              {!isWalkingOnly && liveBusPosition && (
                <View style={styles.liveBusBadgeContainer}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveBusBadgeText}>
                    Ao vivo {liveBusDistanceText ? `(${liveBusDistanceText})` : ""}
                  </Text>
                </View>
              )}
            </View>

            {/* Chips de indicadores */}
            <View style={styles.chipsRow}>
              <View style={styles.chip}>
                <Ionicons name="time" size={18} color="#FFF" />
                <Text style={styles.chipText}>{formatMinutesToFriendlyText(totalDurationMin)}{isWalkingOnly ? " a pé" : ""}</Text>
              </View>
              {isWalkingOnly ? (
                <View style={styles.chip}>
                  <MaterialCommunityIcons name="map-marker-distance" size={18} color="#FFF" />
                  <Text style={styles.chipText}>{activeSummary?.totalDistanceMeters || activeSummary?.initialWalkDistanceMeters || 0}m</Text>
                </View>
              ) : (
                <>
                  <View style={styles.chip}>
                    <FontAwesome6 name="person-walking" size={15} color="#FBBF24" />
                    <Text style={styles.chipText}>{formatMinutesToFriendlyText(initialWalkTimeMin)} a pé</Text>
                  </View>
                  <View style={styles.chip}>
                    <MaterialCommunityIcons name="bus" size={18} color="#34D399" />
                    <Text style={styles.chipText}>{transitSteps.length} {transitSteps.length === 1 ? 'ônibus' : 'ônibus'}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Linha divisória e detalhes */}
            {!isWalkingOnly && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryDetailsGrid}>
                  {busLine ? (
                    <View style={styles.summaryDetailItem}>
                      <Text style={styles.summaryDetailLabel}>Primeiro ônibus</Text>
                      <View style={styles.busLineHighlight}>
                        <MaterialCommunityIcons name="bus" size={16} color="#FFF" />
                        <Text style={styles.busLineNumber}>{busLine}</Text>
                      </View>
                    </View>
                  ) : null}
                  {activeSummary?.leaveHomeAt ? (
                    <View style={styles.summaryDetailItem}>
                      <Text style={styles.summaryDetailLabel}>Saída</Text>
                      <Text style={styles.summaryDetailValue}>{activeSummary.leaveHomeAt}</Text>
                    </View>
                  ) : null}
                  {activeSummary?.arrivalAtDestination ? (
                    <View style={styles.summaryDetailItem}>
                      <Text style={styles.summaryDetailLabel}>Chegada</Text>
                      <Text style={styles.summaryDetailValue}>{activeSummary.arrivalAtDestination}</Text>
                    </View>
                  ) : null}
                </View>
              </>
            )}
          </View>

          {/* 3. PASSO A PASSO */}
          <View style={styles.stepsSection}>
            <View style={styles.stepsSectionHeader}>
              <AdaptiveIcon iosSymbol="map" fallbackFamily="Ionicons" fallbackName="map-outline" size={20} color={theme.text} />
              <Text style={[styles.stepsSectionTitle, { color: theme.text }]}>Passo a passo</Text>
            </View>

            <View style={[
              styles.stepsList, 
              isDark 
                ? { backgroundColor: "rgba(255, 255, 255, 0.02)", borderColor: "rgba(255, 255, 255, 0.04)" }
                : { backgroundColor: "rgba(255, 255, 255, 0.3)", borderColor: "rgba(255, 255, 255, 0.5)" }
            ]}>
              <RouteStep 
                type="start"
                time={activeSummary?.leaveHomeAt || "Agora"}
                title="Saia do seu local"
                description={leaveHomeText || "Comece agora."}
              />

              {isWalkingOnly && (
                <RouteStep
                  type="walk"
                  title={`Caminhe ${formatMinutesToFriendlyText(totalDurationMin)}`}
                  description={`${activeSummary?.totalDistanceMeters || activeSummary?.initialWalkDistanceMeters || 0} metros até o destino`}
                />
              )}

              {!isWalkingOnly && transitSteps.map((step, index) => (
                <RouteStep 
                  key={`step-${index}`}
                  type="bus"
                  time={step.departureTime || (index === 0 ? activeSummary?.beAtStopAt : "") || "--"}
                  title={`Pegue o ônibus ${step.line}`}
                  description={step.lineName || step.headsign || ""}
                  highlight={getShortStopName(step.from)}
                  highlightSecondary={getShortStopName(step.to)}
                />
              ))}

              <RouteStep 
                type="finish"
                time={activeSummary?.arrivalAtDestination || "--"}
                title="Chegada"
                description={destination}
                isLast={true}
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 4. RODAPÉ FIXO DE AÇÕES */}
      <Animated.View 
        entering={FadeInDown.duration(400).delay(200)} 
        style={styles.bottomActionsShadow}
      >
        <View style={[styles.bottomActionsContent, { paddingBottom: insets.bottom + 16 }]}>
          <LiquidGlassView style={StyleSheet.absoluteFillObject} intensity={50} fallbackColor={theme.card} />
          <LinearGradient
            colors={[isDark ? 'rgba(1, 16, 48, 0)' : 'rgba(241, 245, 249, 0)', theme.background]}
            locations={[0.2, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <PrimaryButton
            title={isWalkingOnly ? "Iniciar caminhada" : "Iniciar navegação"}
            onPress={handleStartNavigation}
            disabled={isLoadingCommand}
            isLoading={isLoadingCommand}
            style={styles.mainButton}
            accessibilityLabel="Iniciar navegação para esta rota"
          />
          <ListenOptionsButton 
            label="Ouvir resumo"
            onPress={handleHearRoute} 
            accessibilityLabel="Ouvir resumo da rota em voz alta"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ─── Layout ─── */
  screen: {
    flex: 1,
  },
  fixedHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 5,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 28,
  },

  /* ─── 1. Cabeçalho e Mapa ─── */
  header: {
    alignItems: "flex-start",
    marginBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 4,
  },
  previewMapContainer: {
    height: 220,
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  /* ─── 1.1 Seletor de Rotas Alternativas ─── */
  routeSelectorWrapper: {
    gap: 12,
  },
  routeSelectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeSelectorTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  routeSelectorScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  routeCardOption: {
    width: 145,
    borderRadius: 18,
    padding: 12,
    gap: 8,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  routeCardSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  routeCardUnselected: {
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  routeCardTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  routeCardTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  routeCardBody: {
    gap: 2,
  },
  routeCardDuration: {
    fontSize: 19,
    fontWeight: "900",
  },
  routeCardLines: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* ─── 2. Card de resumo ─── */
  summaryCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    gap: 16,
  },
  topBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(52,211,153,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#34D399",
  },
  liveBusBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.22)",
    borderColor: "rgba(34, 197, 94, 0.45)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  liveBusBadgeText: {
    color: "#4ADE80",
    fontSize: 12,
    fontWeight: "800",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  summaryDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  summaryDetailItem: {
    minWidth: 80,
    gap: 4,
  },
  summaryDetailLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDetailValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  busLineHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(59,130,246,0.4)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  busLineNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  /* ─── 3. Passo a passo ─── */
  stepsSection: {
    gap: 16,
  },
  stepsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepsSectionTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  stepsList: {
    borderRadius: 24,
    padding: 20,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
  },

  /* ─── 4. Rodapé fixo ─── */
  bottomActionsShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomActionsContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.02)",
    overflow: "hidden",
  },
  mainButton: {
    height: 64,
    borderRadius: 32,
  },
});
