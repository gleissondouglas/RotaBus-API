import { BackgroundGradient } from "../src/components/BackgroundGradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackButton } from "../src/components/BackButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { TextField } from "../src/components/TextField";
import { userService } from "../src/services/user.service";
import { useThemeColors } from "../src/theme/colors";

export default function ChangePasswordScreen() {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "A nova senha e a confirmação não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erro", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      const result = await userService.changePassword(currentPassword, newPassword);
      Alert.alert("Sucesso", result.message);
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <BackButton />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
          >

            <Animated.View entering={FadeInUp.duration(600)} style={styles.content}>
              <Text style={[styles.title, { color: theme.text }]}>Alterar senha</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Mantenha sua conta segura trocando sua senha periodicamente.
              </Text>

              <View style={styles.form}>
                <TextField
                  label="Senha atual"
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />

                <TextField
                  label="Nova senha"
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <TextField
                  label="Confirmar nova senha"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <View style={styles.buttonWrapper}>
                  <PrimaryButton
                    title="Alterar senha"
                    onPress={handleSave}
                    isLoading={loading}
                  />
                </View>
              </View>
            </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 64,
    paddingHorizontal: 20,
    gap: 16,
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
    lineHeight: 24,
    fontWeight: "500",
    marginBottom: 8,
  },
  form: {
    gap: 20,
  },
  buttonWrapper: {
    
  },
});
