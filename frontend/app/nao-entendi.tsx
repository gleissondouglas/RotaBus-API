import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";

import { ListenOptionsButton } from "../src/components/ListenOptionsButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { VoiceOrb } from "../src/components/VoiceOrb";
import { useThemeColors } from "../src/theme/colors";
import { BackgroundGradient } from "../src/components/BackgroundGradient";
import { LiquidGlassView } from "../src/components/LiquidGlassView";

export default function DidNotUnderstandScreen() {
  const params = useLocalSearchParams();
  const theme = useThemeColors();

  const latitude = String(params.latitude || "");
  const longitude = String(params.longitude || "");

  const screenMessage = "Desculpe, não consegui entender o destino que você falou. Você pode tocar em falar novamente, digitar o destino ou voltar para a tela inicial.";

  function handleTryAgain() {
    router.replace({
      pathname: "/inicio",
      params: {
        latitude,
        longitude,
      },
    });
  }

  function handleTypeDestination() {
    router.push({
      pathname: "/digitar-destino",
      params: {
        latitude,
        longitude,
      },
    });
  }

  function handleGoHome() {
    router.replace({
      pathname: "/inicio",
      params: {
        latitude,
        longitude,
      },
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
          <View style={styles.content}>
            <View style={styles.orbContainer}>
              <VoiceOrb state="error" size={100} />
            </View>

            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Não consegui entender</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Por favor, tente falar novamente o nome do lugar ou o endereço completo.
              </Text>
            </View>

            <View style={[styles.cardShadow]}>
              <View style={[styles.cardContent, { borderColor: theme.danger }]}>
                <LiquidGlassView style={StyleSheet.absoluteFillObject} intensity={30} fallbackColor="rgba(239, 68, 68, 0.1)" />
                <Text style={[styles.cardText, { color: theme.danger }]}>
                  Se preferir, você também pode digitar o destino usando o teclado.
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <PrimaryButton title="Tentar falar de novo" onPress={handleTryAgain} />

              <ListenOptionsButton textToSpeak={screenMessage} />

              <Pressable
                style={styles.secondaryButton}
                onPress={handleTypeDestination}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Digitar destino</Text>
              </Pressable>

              <Pressable style={styles.homeButton} onPress={handleGoHome}>
                <Text style={[styles.homeButtonText, { color: theme.textMuted }]}>Voltar ao início</Text>
              </Pressable>
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
    paddingHorizontal: 24,
    gap: 32,
    paddingTop: 40,
  },
  orbContainer: {
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    fontWeight: '600',
  },
  cardShadow: {
    width: "100%",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardContent: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "800",
    textDecorationLine: 'underline',
  },
  homeButton: {
    marginTop: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
