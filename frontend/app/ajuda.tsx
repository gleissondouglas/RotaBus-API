import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BackButton } from "../src/components/BackButton";
import { ListenOptionsButton } from "../src/components/ListenOptionsButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useAutoSpeakOnce } from "../src/hooks/useAutoSpeakOnce";
import { useThemeColors } from "../src/theme/colors";
import { AdaptiveIcon } from "../src/components/AdaptiveIcon";

export default function HelpScreen() {
  const params = useLocalSearchParams();
  const theme = useThemeColors();

  const latitude = String(params.latitude || "");
  const longitude = String(params.longitude || "");

  const screenMessage =
    "Você está na tela de ajuda. Para buscar uma rota, toque em falar destino. Se preferir escrever, toque em digitar destino. Você também pode acessar as configurações.";

  useAutoSpeakOnce("ajuda", screenMessage);

  function handleSpeakDestination() {
    router.push({
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

  function handleSettings() {
    router.push({
      pathname: "/configuracoes",
      params: {
        latitude,
        longitude,
      },
    });
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <BackButton />

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Ajuda</Text>

          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Veja como usar o RotaBus de forma simples.
          </Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
              <AdaptiveIcon iosSymbol="mic" fallbackFamily="Ionicons" fallbackName="mic-outline" size={28} color={theme.primary} />
            </View>

            <View style={styles.cardTextBox}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Falar destino</Text>
              <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                Mantenha o botão de voz pressionado e diga para onde você quer
                ir.
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
              <AdaptiveIcon iosSymbol="keyboard" fallbackFamily="Ionicons" fallbackName="create-outline" size={28} color={theme.primary} />
            </View>

            <View style={styles.cardTextBox}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Digitar destino</Text>
              <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                Se preferir, você pode escrever o local desejado.
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
              <AdaptiveIcon iosSymbol="bus" fallbackFamily="Ionicons" fallbackName="bus-outline" size={28} color={theme.primary} />
            </View>

            <View style={styles.cardTextBox}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Ir até o ponto</Text>
              <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                O RotaBus mostra o ponto de ônibus mais próximo e guia você até
                lá.
              </Text>
            </View>
          </View>

          <PrimaryButton
            title="Falar destino"
            onPress={handleSpeakDestination}
          />

          <ListenOptionsButton textToSpeak={screenMessage} />

          <Pressable
            style={styles.secondaryButton}
            onPress={handleTypeDestination}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Digitar destino</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleSettings}>
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Configurações</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 6,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTextBox: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  cardDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
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
