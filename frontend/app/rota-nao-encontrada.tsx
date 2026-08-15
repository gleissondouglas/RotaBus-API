import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";

import { BackButton } from "../src/components/BackButton";
import { ListenOptionsButton } from "../src/components/ListenOptionsButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useAutoSpeakOnce } from "../src/hooks/useAutoSpeakOnce";
import { useThemeColors } from "../src/theme/colors";
import { LiquidGlassView } from "../src/components/LiquidGlassView";
import { AdaptiveIcon } from "../src/components/AdaptiveIcon";
import { BackgroundGradient } from "../src/components/BackgroundGradient";

export default function RouteNotFoundScreen() {
  const params = useLocalSearchParams();
  const theme = useThemeColors();

  const latitude = String(params.latitude || "");
  const longitude = String(params.longitude || "");
  const destination = String(params.destination || "");
  const message = String(params.message || "Não encontramos uma rota disponível para esse destino no momento.");
  const isVoiceSearch = String(params.isVoiceSearch || "false");

  const isDailyLimit = message.toLowerCase().includes("limite") || message.toLowerCase().includes("requisições");

  const screenMessage = isDailyLimit
    ? "O limite de buscas para hoje foi atingido. Por favor, tente novamente amanhã ou mais tarde."
    : `Não consegui encontrar uma rota para ${destination}. ${message}`;

  useAutoSpeakOnce(`not-found-${destination}`, screenMessage, isVoiceSearch === "true");

  function handleGoHome() {
    router.replace({
      pathname: "/inicio",
      params: { latitude, longitude },
    });
  }

  function handleTryAgain() {
    router.replace({
      pathname: "/digitar-destino",
      params: { latitude, longitude },
    });
  }

  return (
    <View style={styles.screen}>
      <BackgroundGradient />
      <ScreenContainer backgroundColor="transparent">
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <BackButton label="Início" onPress={handleGoHome} />

        <View style={styles.content}>
          <View style={[styles.iconContainer, isDailyLimit ? { backgroundColor: "rgba(255, 152, 0, 0.1)" } : { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
            <AdaptiveIcon 
              iosSymbol={isDailyLimit ? "clock.badge.exclamationmark" : "mappin.slash"} 
              fallbackFamily="MaterialCommunityIcons"
              fallbackName={isDailyLimit ? "clock-alert" : "map-marker-off"} 
              size={64} 
              color={isDailyLimit ? "#FF9800" : theme.danger} 
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]}>
              {isDailyLimit ? "Limite atingido" : "Rota não encontrada"}
            </Text>
            
            <View style={styles.messageCardShadow}>
              <View style={[styles.messageCardContent, { borderColor: theme.border }]}>
                <LiquidGlassView style={StyleSheet.absoluteFillObject} fallbackColor={theme.card} />
                <Text style={[styles.messageText, { color: theme.text }]}>{message}</Text>
              </View>
            </View>

            <Text style={[styles.hintText, { color: theme.textMuted }]}>
              {isDailyLimit 
                ? "O RotaBus tem um limite diário de buscas. Tente novamente amanhã." 
                : "Você pode tentar digitar o endereço novamente ou escolher outro local próximo."}
            </Text>
          </View>

          <View style={styles.actions}>
            {!isDailyLimit && (
              <PrimaryButton 
                title="Tentar outro destino" 
                onPress={handleTryAgain} 
              />
            )}
            
            {isDailyLimit ? (
              <PrimaryButton 
                title="Voltar ao início" 
                onPress={handleGoHome}
              />
            ) : (
              <Pressable 
                style={[styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={handleGoHome}
                accessibilityRole="button"
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Voltar ao início</Text>
              </Pressable>
            )}

            <ListenOptionsButton textToSpeak={screenMessage} />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    gap: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  textContainer: {
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
  },
  messageCardShadow: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  messageCardContent: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  messageText: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "600",
  },
  hintText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actions: {
    width: "100%",
    gap: 16,
  },
  secondaryButton: {
    width: "100%",
    minHeight: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "800",
  },
});
