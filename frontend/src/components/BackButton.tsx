import { router } from "expo-router";
import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LiquidGlassView } from "./LiquidGlassView";
import { useThemeColors } from "../theme/colors";

type BackButtonProps = {
  label?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function BackButton({ label = "Voltar", onPress, accessibilityLabel }: BackButtonProps) {
  const theme = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    router.back();
  }

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.button, 
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
      ]} 
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      <LiquidGlassView 
        style={[
          styles.glassPill, 
          isDark 
            ? { backgroundColor: "rgba(15, 23, 42, 0.6)", borderColor: "rgba(255, 255, 255, 0.15)" } 
            : { backgroundColor: "rgba(255, 255, 255, 0.8)", borderColor: "rgba(255, 255, 255, 0.9)" }
        ]} 
        intensity={isDark ? 40 : 80} 
        fallbackColor={theme.card}
      >
        <Ionicons name="chevron-back" size={18} color={theme.text} />
        <Text style={[styles.text, { color: theme.text }]}>{label}</Text>
      </LiquidGlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
  },
  glassPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
