import { BackgroundGradient } from "../src/components/BackgroundGradient";
import { LiquidGlassView } from "../src/components/LiquidGlassView";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { BackButton } from "../src/components/BackButton";
import { ListenOptionsButton } from "../src/components/ListenOptionsButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useAutoSpeakOnce } from "../src/hooks/useAutoSpeakOnce";
import { useAccessibility } from "../src/contexts/AccessibilityContext";
import { useThemeColors } from "../src/theme/colors";

export default function AccessibilityScreen() {
  const {
    largeText,
    slowVoice,
    highContrast,
    autoRead,
    vibration,
    updateSettings,
  } = useAccessibility();

  const theme = useThemeColors();

  const screenMessage =
    "Você está na tela de acessibilidade. Aqui você pode configurar texto maior, voz mais lenta, alto contraste, leitura automática das telas e vibração.";

  useAutoSpeakOnce("acessibilidade", screenMessage);

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <ScreenContainer withPadding={false} backgroundColor="transparent">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topBar}>
          <BackButton />
        </View>

        <Animated.View entering={FadeInUp.duration(600)} style={styles.content}>
          <View style={styles.textHeader}>
            <Text style={[styles.title, { color: theme.text }]}>Acessibilidade</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Ajuste o app para ficar mais fácil de usar de acordo com suas necessidades.
            </Text>
          </View>

          <LiquidGlassView style={[styles.card, { backgroundColor: "transparent" }]} intensity={80} fallbackColor={theme.card}>
            <View style={styles.option}>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Texto maior</Text>
                <Text style={[styles.optionDescription, { color: theme.textMuted }]}>
                  Aumenta o tamanho das letras no app para facilitar a leitura.
                </Text>
              </View>

              <Switch
                value={largeText}
                onValueChange={(val) => updateSettings({ largeText: val })}
                trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.option}>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Voz mais lenta</Text>
                <Text style={[styles.optionDescription, { color: theme.textMuted }]}>
                  Faz a assistente falar com mais calma e clareza.
                </Text>
              </View>

              <Switch
                value={slowVoice}
                onValueChange={(val) => updateSettings({ slowVoice: val })}
                trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.option}>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Alto contraste</Text>
                <Text style={[styles.optionDescription, { color: theme.textMuted }]}>
                  Melhora a visualização com cores mais fortes.
                </Text>
              </View>

              <Switch
                value={highContrast}
                onValueChange={(val) => updateSettings({ highContrast: val })}
                trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.option}>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  Leitura automática
                </Text>
                <Text style={[styles.optionDescription, { color: theme.textMuted }]}>
                  A assistente narra as telas ao entrar nelas.
                </Text>
              </View>

              <Switch
                value={autoRead}
                onValueChange={(val) => updateSettings({ autoRead: val })}
                trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.option}>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Vibração</Text>
                <Text style={[styles.optionDescription, { color: theme.textMuted }]}>
                  Usa vibração para avisos e confirmações.
                </Text>
              </View>

              <Switch
                value={vibration}
                onValueChange={(val) => updateSettings({ vibration: val })}
                trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
              />
            </View>
          </LiquidGlassView>

          <View style={styles.footer}>
            <Text style={[styles.note, { color: theme.textMuted }]}>
              Suas preferências são salvas automaticamente.
            </Text>

            <View style={styles.ttsWrapper}>
              <ListenOptionsButton textToSpeak={screenMessage} />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  content: {
    flex: 1,
    gap: 32,
    paddingHorizontal: 20,
    marginTop: 8,
  },

  textHeader: {
    alignItems: "center",
    gap: 8,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 17,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 24,
  },

  card: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
  },

  optionTextBox: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  optionDescription: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },

  divider: {
    height: 1,
  },

  footer: {
    alignItems: "center",
    gap: 24,
  },

  note: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },

  ttsWrapper: {
    opacity: 0.8,
  },
});
