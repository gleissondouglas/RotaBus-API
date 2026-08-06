import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { userService } from "./user.service";
import { sessionService } from "./session.service";

// Configura o comportamento padrão quando uma notificação chega e o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Solicita permissões e registra o dispositivo no Expo Push Notification Service.
 * Se bem-sucedido, envia o token para o backend.
 */
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.warn("Push Notifications não funcionam em simuladores (exceto iOS 16.4+ e Android Emulators com Play Services).");
    return null;
  }

  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permissão para Push Notifications negada!");
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      throw new Error("Project ID não encontrado na configuração do Expo.");
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    console.log("Expo Push Token gerado:", token);

    // Enviar o token para o backend, atrelando ao usuário atual
    const userToken = await sessionService.getToken();
    if (userToken) {
      await userService.updatePushToken(token);
    }
  } catch (error) {
    console.error("Erro ao registrar Push Notification:", error);
  }

  return token;
}
