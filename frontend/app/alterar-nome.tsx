import { BackgroundGradient } from "../src/components/BackgroundGradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { BackButton } from "../src/components/BackButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { TextField } from "../src/components/TextField";
import { userService } from "../src/services/user.service";
import { sessionService } from "../src/services/session.service";
import { useThemeColors } from "../src/theme/colors";

export default function EditNameScreen() {
  const theme = useThemeColors();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const user = await sessionService.getUser();
      if (user) {
        setName(user.name);
      }
      setInitialLoading(false);
    }
    loadUser();
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Erro", "Por favor, informe seu nome.");
      return;
    }

    try {
      setLoading(true);
      const result = await userService.updateProfile(name);
      Alert.alert("Sucesso", result.message);
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <View style={{ flex: 1 }}>
        <BackgroundGradient />
        <ScreenContainer backgroundColor="transparent">
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <ScreenContainer withPadding={false} backgroundColor="transparent">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.topBar}>
              <BackButton />
            </View>

            <Animated.View entering={FadeInUp.duration(600)} style={styles.content}>
              <Text style={[styles.title, { color: theme.text }]}>Alterar nome</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Como você gostaria que o RotaBus chamasse você?
              </Text>

              <View style={styles.form}>
                <TextField
                  label="Seu nome"
                  placeholder="Ex: Maria Oliveira"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <View style={styles.buttonWrapper}>
                  <PrimaryButton
                    title="Salvar alteração"
                    onPress={handleSave}
                    isLoading={loading}
                  />
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
    paddingTop: 32,
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
    gap: 24,
  },
  buttonWrapper: {
    marginTop: 8,
  },
});
