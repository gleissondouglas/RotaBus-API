import { speak } from "../services/speech.service";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../theme/colors";
import { logUserInteraction } from "../utils/devLogger";

type ListenOptionsButtonProps = {
  textToSpeak?: string;
  onPress?: () => void;
  label?: string;
  accessibilityLabel?: string;
};

export function ListenOptionsButton({
  textToSpeak,
  onPress,
  label = "Ouvir opções",
  accessibilityLabel,
}: ListenOptionsButtonProps) {
  const theme = useThemeColors();

  function handlePress() {
    logUserInteraction({
      component: "<ListenOptionsButton />",
      label: accessibilityLabel || label,
      fileOrScreen: "src/components/ListenOptionsButton.tsx",
      action: "Falar orientações da tela (TTS)",
      details: textToSpeak ? { text: textToSpeak } : undefined,
    });

    if (onPress) {
      onPress();
      return;
    }

    speak(
      textToSpeak ||
        "Você está usando o RotaBus. Use os botões da tela para continuar.",
    );
  }

  return (
    <Pressable 
      style={[styles.button, { backgroundColor: theme.primary + "0D" }]} 
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      <Ionicons name="volume-high-outline" size={20} color={theme.primary} />
      <Text style={[styles.text, { color: theme.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 8,
    borderRadius: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
  },
});
