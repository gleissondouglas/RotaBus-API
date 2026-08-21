import { BackgroundGradient } from "../src/components/BackgroundGradient";
import { LiquidGlassView } from "../src/components/LiquidGlassView";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdaptiveIcon } from "../src/components/AdaptiveIcon";
import { BackButton } from "../src/components/BackButton";
import { ListenOptionsButton } from "../src/components/ListenOptionsButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { useAutoSpeakOnce } from "../src/hooks/useAutoSpeakOnce";
import { useThemeColors } from "../src/theme/colors";

export default function HelpScreen() {
  const params = useLocalSearchParams();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();

  const latitude = String(params.latitude || "");
  const longitude = String(params.longitude || "");

  const screenMessage =
    "Você está na tela de ajuda. Para buscar uma rota, toque em falar destino. Se preferir escrever, toque em digitar destino. Você também pode acessar as configurações.";

  useAutoSpeakOnce("ajuda", screenMessage);

  function handleSpeakDestination() {
    router.push({
      pathname: "/inicio",
      params: { latitude, longitude },
    });
  }

  function handleTypeDestination() {
    router.push({
      pathname: "/digitar-destino",
      params: { latitude, longitude },
    });
  }

  function handleSettings() {
    router.push({
      pathname: "/configuracoes",
      params: { latitude, longitude },
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <BackButton />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
      >
          <Animated.View entering={FadeInUp.duration(600)} style={styles.content}>
            <View style={styles.textHeader}>
              <Text style={[styles.title, { color: theme.text }]}>Ajuda</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Veja como usar o RotaBus de forma simples.
              </Text>
            </View>

            <LiquidGlassView
              style={styles.section}
              fallbackColor={theme.card}
            >
              <View style={styles.option}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                  <AdaptiveIcon iosSymbol="mic" fallbackFamily="Ionicons" fallbackName="mic-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.cardTextBox}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Falar destino</Text>
                  <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                    Mantenha o botão de voz pressionado e diga para onde você quer ir.
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.option}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                  <AdaptiveIcon iosSymbol="keyboard" fallbackFamily="Ionicons" fallbackName="create-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.cardTextBox}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Digitar destino</Text>
                  <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                    Se preferir, você pode escrever o local desejado.
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.option}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                  <AdaptiveIcon iosSymbol="bus" fallbackFamily="Ionicons" fallbackName="bus-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.cardTextBox}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Ir até o ponto</Text>
                  <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                    O RotaBus mostra o ponto de ônibus mais próximo e guia você até lá.
                  </Text>
                </View>
              </View>
            </LiquidGlassView>

            <View style={styles.actions}>
              <PrimaryButton title="Falar destino" onPress={handleSpeakDestination} />

              <ListenOptionsButton textToSpeak={screenMessage} />

              <Pressable style={styles.secondaryButton} onPress={handleTypeDestination}>
                <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Digitar destino</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={handleSettings}>
                <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Configurações</Text>
              </Pressable>
            </View>
          </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  content: {
    flex: 1,
    gap: 20,
    paddingHorizontal: 20,
    
  },

  textHeader: {
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 24,
  },

  section: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
  },

  divider: {
    height: 1,
    marginVertical: 4,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTextBox: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  cardDescription: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  actions: {
    gap: 16,
    alignItems: "center",
  },

  secondaryButton: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
