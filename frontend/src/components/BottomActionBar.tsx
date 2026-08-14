import { Platform, Pressable, StyleSheet, Text, View, Dimensions } from "react-native";

import type { VoiceLoopStatus } from "../hooks/useVoiceConversationLoop";
import { BottomVoiceMicButton } from "./BottomVoiceMicButton";
import { LiquidGlassView } from "./LiquidGlassView";
import { AdaptiveIcon } from "./AdaptiveIcon";
import { useThemeColors } from "../theme/colors";

type BottomActionBarStatus = VoiceLoopStatus | "success";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BottomActionBarProps {
  status: BottomActionBarStatus;
  micLabel: string;
  onTypeDestination: () => void;
  onMicPress: () => void;
}

export function BottomActionBar({ status, micLabel, onTypeDestination, onMicPress }: BottomActionBarProps) {
  const isTypingDisabled = status === "speaking" || status === "processing" || status === "success";
  const theme = useThemeColors();

  return (
    <LiquidGlassView style={styles.pill} intensity={40} fallbackColor={theme.card}>
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.typeButton, pressed && styles.typeButtonPressed, isTypingDisabled && styles.typeButtonDisabled]}
          onPress={onTypeDestination}
          disabled={isTypingDisabled}
          accessibilityLabel="Digitar destino"
          accessibilityRole="button"
        >
          <AdaptiveIcon iosSymbol="square.and.pencil" fallbackFamily="Ionicons" fallbackName="pencil" size={20} color={theme.text} />
          <Text style={[styles.typeText, { color: theme.text }]}>Digitar destino</Text>
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <BottomVoiceMicButton status={status} label={micLabel} compact tone="primary" onPress={onMicPress} accessibilityLabel={micLabel} />
      </View>
    </LiquidGlassView>
  );
}

const APPLE_FONT = Platform.select({
  ios: { fontFamily: "System" },
  default: { fontFamily: "System" },
});

const styles = StyleSheet.create({
  pill: { width: SCREEN_WIDTH - 24, height: 88, borderRadius: 44, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 15, overflow: "hidden", borderWidth: 1, borderColor: "rgba(200,200,200,0.5)" },
  row: { flexDirection: "row", alignItems: "center", height: 88, paddingHorizontal: 8, paddingVertical: 8 },
  typeButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, borderRadius: 36 },
  typeButtonPressed: { opacity: 0.6 },
  typeButtonDisabled: { opacity: 0.4 },
  typeText: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3, ...APPLE_FONT },
  divider: { width: 1, height: 40, marginHorizontal: 4 },
});
