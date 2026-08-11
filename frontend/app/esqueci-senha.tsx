import { BackgroundGradient } from "../src/components/BackgroundGradient";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { BackButton } from "../src/components/BackButton";
import { ListenOptionsButton } from "../src/components/ListenOptionsButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { TextField } from "../src/components/TextField";
import { authService } from "../src/services/auth.service";
import { useThemeColors } from "../src/theme/colors";
import { LinearGradient } from "expo-linear-gradient";

export default function ForgotPasswordScreen() {
  const theme = useThemeColors();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert("Atenção", "Digite o e-mail cadastrado na sua conta.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await authService.forgotPassword(email.trim());

      setIsSuccess(true);
      Alert.alert(
        "Verifique seu e-mail",
        response.message || "Enviamos instruções para recuperar a sua senha.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar a recuperação de senha."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <ScreenContainer withPadding={false} backgroundColor="transparent">
      <View style={styles.header}>
        <BackButton />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.container}>
          <View style={styles.textHeader}>
            <Text style={[styles.title, { color: theme.text }]}>Recuperar Senha</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Digite seu e-mail e nós lhe enviaremos um link para você poder criar uma nova senha.
            </Text>
          </View>

          <View style={styles.cardContent}>
            <TextField
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <PrimaryButton
              title="Recuperar senha"
              onPress={handleReset}
              isLoading={isLoading}
              disabled={isSuccess}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <View style={styles.ttsWrapper}>
              <ListenOptionsButton textToSpeak="Você está na tela de recuperação de senha. Digite o seu e-mail e toque no botão recuperar senha para receber as instruções." />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 20,
    gap: 32,
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
    paddingHorizontal: 10,
  },
  cardContent: {
    gap: 16,
    paddingTop: 8,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    height: 64,
    borderRadius: 32,
  },
  footer: {
    alignItems: "center",
    gap: 24,
  },
  ttsWrapper: {
    opacity: 0.8,
  },
});
