import React, { useRef, useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Text, useColorScheme } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MapData, MapMarker, MapFocusMode } from '../types/journey.types';
import { decodePolyline } from '../utils/polyline';
import { useThemeColors } from '../theme/colors';
import { LiquidGlassView } from './LiquidGlassView';

interface MapProps {
  mapData?: MapData;
  userLocation?: {
    latitude: number;
    longitude: number;
    heading?: number | null;
  } | null;
  liveBusPosition?: {
    lat: number;
    lng: number;
    heading?: number | null;
  } | null;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  colors: any;
  userHeading?: number | null;
  focusMode?: MapFocusMode;
  onFocusModeChange?: (mode: MapFocusMode) => void;
  controlsBottomOffset?: number;
  walkSteps?: any[];
  currentStepIndex?: number;
  isNavigating?: boolean;
}

const cleanMapStyle = [
  { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }
];

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const getMarkerColor = (type: MapMarker['type']) => {
  switch (type) {
    case 'boarding_stop': return '#3B82F6';
    case 'transfer_stop': return '#F59E0B';
    case 'dropoff_stop': return '#EF4444';
    case 'destination': return '#8B5CF6';
    case 'user': return '#3B82F6';
    case 'origin': return '#6B7280';
    default: return '#6B7280';
  }
};

/**
 * Componente de Mapa customizado usando react-native-maps.
 * Ele gerencia a exibição da rota, marcadores e o movimento da câmera (seguir usuário).
 */

const Map: React.FC<MapProps> = ({
  mapData,
  userLocation,
  liveBusPosition,
  initialRegion,
  colors: propColors,
  focusMode = 'walking_to_stop',
  onFocusModeChange,
  controlsBottomOffset = 16,
  walkSteps = [],
  currentStepIndex = 0,
  isNavigating = false,
  userHeading,
}) => {
  const mapRef = useRef<MapView>(null);
  // Estado para saber se o mapa deve "travar" a câmera no usuário
  const [isFollowingUser, setIsFollowingUser] = useState(isNavigating);
  const colorScheme = useColorScheme();
  const theme = useThemeColors();

  /**
   * Centraliza o mapa no usuário.
   * Se estiver navegando, usa a câmera 3D (pitch) e zoom próximo.
   */
  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      setIsFollowingUser(true);
      if (isNavigating) {
        mapRef.current.animateCamera({
          center: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          pitch: 45,
          heading: userHeading ?? userLocation.heading ?? 0,
          zoom: 19,
        }, { duration: 1000 });
      } else {
        mapRef.current.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }, 1000);
      }
    }
  };

  /**
   * Alterna entre ver apenas o caminho até o ponto ou a rota inteira.
   */
  const toggleFocusMode = () => {
    if (onFocusModeChange) {
      const nextMode = focusMode === 'full_route' ? 'walking_to_stop' : 'full_route';
      onFocusModeChange(nextMode);
    }
  };

  /**
   * Efeito que controla o enquadramento (Auto-fit) do mapa.
   * Ele decide quais coordenadas devem aparecer na tela baseado no modo de foco.
   */
  useEffect(() => {
    if (!mapRef.current) return;
    let fitTimer: ReturnType<typeof setTimeout> | undefined;

    // Se estiver no modo de navegação ativa, a câmera segue o usuário como um GPS
    if (isNavigating && userLocation && isFollowingUser) {
      mapRef.current.animateCamera({
        center: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        pitch: 50, // Inclinação para dar perspectiva 3D
        heading: userHeading ?? userLocation.heading ?? 0, // Gira o mapa conforme o usuário vira o corpo/celular
        zoom: 19,
      }, { duration: 800 });
      return;
    }

    // Se o usuário arrastou o mapa manualmente, paramos de seguir automaticamente
    if (!isFollowingUser && isNavigating) return;

    // Lógica para decidir o enquadramento (quais marcadores e linhas devem caber na tela)
    const coordinatesToFit: { latitude: number; longitude: number }[] = [];
    if (userLocation) coordinatesToFit.push({ latitude: Number(userLocation.latitude), longitude: Number(userLocation.longitude) });
    
    if (focusMode === 'full_route') {
      // No modo rota cheia, tenta colocar todos os marcadores e polilinhas na visão
      if (mapData?.markers) mapData.markers.forEach(marker => coordinatesToFit.push({ latitude: Number(marker.lat), longitude: Number(marker.lng) }));
      if (mapData?.polylines) {
        mapData.polylines.forEach(polyline => {
          const decoded = decodePolyline(polyline.encodedPolyline);
          decoded.forEach(coord => coordinatesToFit.push({ latitude: Number(coord.latitude), longitude: Number(coord.longitude) }));
        });
      }
    } else if (focusMode === 'walking_to_stop' || focusMode === 'walking_to_destination' || focusMode === 'on_bus' || focusMode === 'transfer') {
      // Sempre focamos a câmera no trecho atual em andamento
      if (walkSteps && walkSteps.length > 0 && currentStepIndex !== undefined) {
        const currentStep = walkSteps[currentStepIndex];
        if (currentStep && currentStep.polyline) {
          const decoded = decodePolyline(currentStep.polyline);
          decoded.forEach(coord => coordinatesToFit.push({ latitude: Number(coord.latitude), longitude: Number(coord.longitude) }));
        }
      }
    }
    
    // Aplica o ajuste de visão (fitToCoordinates) com proteção para coordenadas inválidas (NaN)
    const isValidCoord = (c: any) => c && typeof c.latitude === 'number' && !isNaN(c.latitude) && isFinite(c.latitude) && typeof c.longitude === 'number' && !isNaN(c.longitude) && isFinite(c.longitude);
    const validCoords = coordinatesToFit.filter(isValidCoord);

    if (validCoords.length >= 1) {
      const uniqueCoords = validCoords.filter((c, i, self) => i === self.findIndex(t => t.latitude === c.latitude && t.longitude === c.longitude));
      fitTimer = setTimeout(() => {
        try {
          if (uniqueCoords.length === 1) {
            mapRef.current?.animateToRegion({ ...uniqueCoords[0], latitudeDelta: 0.003, longitudeDelta: 0.003 }, 1000);
          } else if (uniqueCoords.length > 1) {
            mapRef.current?.fitToCoordinates(uniqueCoords, { 
              edgePadding: { top: 60, right: 20, bottom: controlsBottomOffset + 20, left: 20 }, 
              animated: true 
            });
          }
        } catch (err) {
          console.warn("[Map] Falha ao ajustar visão:", err);
        }
      }, 500);
    }

    return () => {
      if (fitTimer) clearTimeout(fitTimer);
    };
  }, [mapData, userLocation, userHeading, focusMode, controlsBottomOffset, currentStepIndex, walkSteps, isFollowingUser, isNavigating]);

  const renderedGeneralPolylines = useMemo(() => {
    if ((walkSteps && walkSteps.length > 0) && focusMode !== 'full_route') {
      return [];
    }
    if (!mapData?.polylines) return [];

    return mapData.polylines
      .filter(p => focusMode === 'full_route' || p.type === 'walk')
      .map(polyline => {
        const coords = decodePolyline(polyline.encodedPolyline);
        if (coords.length < 2) return null;
        const isWalk = polyline.type === 'walk';
        return {
          id: polyline.id,
          coords,
          strokeColor: isWalk ? theme.primary : '#22C55E',
          strokeWidth: isWalk ? 8 : 6,
          lineDashPattern: isWalk ? [1, 10] : undefined,
          zIndex: isWalk ? 2 : 1,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [mapData?.polylines, walkSteps, focusMode, theme.primary]);

  const renderedWalkStepPolylines = useMemo(() => {
    if (!walkSteps || walkSteps.length === 0 || focusMode === 'full_route') {
      return [];
    }

    return walkSteps
      .map((step, index) => {
        const coords = decodePolyline(step.polyline);
        if (coords.length < 2) return null;

        const isActive = index === currentStepIndex;
        const isPast = index < currentStepIndex;
        const isTransit = step.type === 'transit';

        let strokeColor = isTransit ? '#22C55E' : theme.primary;
        let strokeWidth = isTransit ? 10 : 14;
        let zIndex = 5;
        let lineDashPattern: number[] | undefined = isTransit ? undefined : [1, 10];

        if (isPast) {
          strokeColor = '#CBD5E1';
          strokeWidth = 8;
          zIndex = 3;
          lineDashPattern = isTransit ? undefined : [1, 8];
        } else if (!isActive) {
          strokeColor = isTransit ? 'rgba(34, 197, 94, 0.4)' : theme.primary;
          strokeWidth = isTransit ? 8 : 10;
          zIndex = 4;
          lineDashPattern = isTransit ? undefined : [1, 12];
        }

        return {
          key: `walk-step-${index}`,
          coords,
          strokeColor,
          strokeWidth,
          lineDashPattern,
          zIndex,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [focusMode, walkSteps, currentStepIndex, theme.primary]);

  const renderedTurnMarkers = useMemo(() => {
    if (!walkSteps || walkSteps.length === 0 || focusMode === 'full_route') {
      return [];
    }

    return walkSteps
      .map((step, index) => {
        if (!step.endLocation || index === walkSteps.length - 1) return null;
        const isPast = index < currentStepIndex;
        if (isPast) return null;

        return {
          key: `turn-${index}`,
          latitude: Number(step.endLocation.lat),
          longitude: Number(step.endLocation.lng),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [focusMode, walkSteps, currentStepIndex]);

  const renderedMainMarkers = useMemo(() => {
    if (!mapData?.markers) return [];

    return mapData.markers
      .filter(m => {
        if (!m) return false;
        const lat = Number(m.lat);
        const lng = Number(m.lng);
        if (isNaN(lat) || !isFinite(lat) || isNaN(lng) || !isFinite(lng)) return false;
        if (m.type === 'user') return false;
        if (focusMode === 'full_route') return true;
        return m.type === 'boarding_stop';
      })
      .map((marker, idx) => ({
        id: `${marker.id || 'marker'}-${idx}`,
        latitude: Number(marker.lat),
        longitude: Number(marker.lng),
        title: marker.title || '',
        description: marker.description || '',
        type: marker.type,
        pinColor: getMarkerColor(marker.type),
      }));
  }, [mapData?.markers, focusMode]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        loadingEnabled={true}
        loadingBackgroundColor={theme.background}
        customMapStyle={Platform.OS === 'android' ? (colorScheme === 'dark' ? darkMapStyle : cleanMapStyle) : undefined}
        userLocationAnnotationTitle=""
        mapPadding={{ top: 0, right: 0, left: 0, bottom: controlsBottomOffset }}
        onPanDrag={() => {
          if (isFollowingUser) setIsFollowingUser(false);
        }}
      >
        {/* Renderização de Rota Geral (Full Route ou Fallback Walk) */}
        {renderedGeneralPolylines.map((item) => (
          <Polyline
            key={item.id}
            coordinates={item.coords}
            strokeColor={item.strokeColor}
            strokeWidth={item.strokeWidth}
            lineDashPattern={item.lineDashPattern}
            zIndex={item.zIndex}
            lineCap="round"
          />
        ))}

        {/* Renderização Guiada de Passos de Caminhada */}
        {renderedWalkStepPolylines.map((item) => (
          <Polyline
            key={item.key}
            coordinates={item.coords}
            strokeColor={item.strokeColor}
            strokeWidth={item.strokeWidth}
            lineDashPattern={item.lineDashPattern}
            zIndex={item.zIndex}
            lineCap="round"
            lineJoin="round"
          />
        ))}

        {/* Marcadores de Virada */}
        {renderedTurnMarkers.map((turn) => (
          <Marker
            key={turn.key}
            coordinate={{ latitude: turn.latitude, longitude: turn.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            zIndex={10}
          >
            <View style={[styles.turnDot, { backgroundColor: 'white', borderColor: theme.primary }]} />
          </Marker>
        ))}

        {/* Marcadores Principais */}
        {renderedMainMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.description}
            pinColor={marker.pinColor}
            zIndex={20}
            accessibilityLabel={`Ponto: ${marker.title}`}
          >
            {marker.type === 'boarding_stop' && (
              <View style={styles.markerWithLabel}>
                <View style={[styles.boardingMarker, { backgroundColor: getMarkerColor('boarding_stop') }]}>
                  <MaterialCommunityIcons name="bus" size={24} color="white" />
                </View>
                <View style={styles.markerLabelContainer}>
                  <Text style={styles.markerLabelText}>Ponto</Text>
                </View>
              </View>
            )}
            <Callout>
              <View style={[styles.callout, { backgroundColor: theme.card }]}>
                <Text style={[styles.calloutTitle, { color: theme.text }]}>{marker.title}</Text>
                {!!marker.description && <Text style={[styles.calloutDesc, { color: theme.textMuted }]}>{marker.description}</Text>}
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Marcador do Ônibus ao Vivo (Crowdsourcing) */}
        {liveBusPosition && (
          <Marker
            key="live-bus-marker"
            coordinate={{ latitude: liveBusPosition.lat, longitude: liveBusPosition.lng }}
            zIndex={30}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={liveBusPosition.heading || 0}
          >
            <View style={styles.liveBusMarker}>
              <MaterialCommunityIcons name="bus-side" size={22} color="white" />
            </View>
          </Marker>
        )}
      </MapView>
      <View style={[styles.controls, { bottom: controlsBottomOffset + 16 }]} pointerEvents="box-none">
        <LiquidGlassView style={styles.controlGroup}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleRecenter} 
            activeOpacity={0.7}
            accessibilityLabel="Centralizar minha localização"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={toggleFocusMode} 
            activeOpacity={0.7}
            accessibilityLabel={focusMode === 'full_route' ? "Focar na caminhada" : "Ver rota completa"}
            accessibilityRole="button"
          >
            <Ionicons name={focusMode === 'full_route' ? "eye-off" : "map"} size={24} color={theme.primary} />
          </TouchableOpacity>
        </LiquidGlassView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  map: { width: '100%', height: '100%' },
  controls: { 
    position: 'absolute', 
    right: 12, 
    zIndex: 100 
  },
  controlGroup: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  controlButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  boardingMarker: {
    padding: 8,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerWithLabel: {
    alignItems: 'center',
  },
  markerLabelContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  liveBusMarker: {
    backgroundColor: '#F59E0B',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3B82F6',
  },
  turnDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  callout: { padding: 10, minWidth: 140, borderRadius: 12 },
  calloutTitle: { fontWeight: '800', fontSize: 15 },
  calloutDesc: { fontSize: 13, marginTop: 2 },
});

export default Map;
