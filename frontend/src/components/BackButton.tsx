import { router } from "expo-router";
import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LiquidGlassView } from "./LiquidGlassView";
import { useThemeColors } from "../theme/colors";
import { logUserInteraction } from "../utils/devLogger";

type BackButtonProps = {
  label?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  fileOrScreen?: string;
};

export function BackButton({ label = "Voltar", onPress, accessibilityLabel, fileOrScreen }: BackButtonProps) {
  const theme = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  function handlePress() {
    logUserInteraction({
      component: "<BackButton />",
      label: accessibilityLabel || label,
      fileOrScreen: fileOrScreen || "src/components/BackButton.tsx",
      action: onPress ? "Disparou onPress customizado" : "Retornou à tela anterior (router.back)",
    });

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
            ? { backgroundColor: "rgba(15, 23, 42, 0.3)", borderColor: "rgba(255, 255, 255, 0.15)" } 
            : { backgroundColor: "rgba(255, 255, 255, 0.2)", borderColor: "rgba(255, 255, 255, 0.4)" }
        ]} 
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
    justifyContent: "center",
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
