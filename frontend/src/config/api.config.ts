import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

function getBaseUrl() {
  const extraApiUrl = Constants.expoConfig?.extra?.apiBaseUrl;

  // ==========================================
  // PRIORIDADE MÁXIMA: URL configurada no .env
  // Se foi configurada uma URL externa (Render, ngrok, etc.), ela sempre vence.
  // ==========================================
  if (extraApiUrl && !extraApiUrl.includes("localhost") && !extraApiUrl.includes("192.168.")) {
    return extraApiUrl;
  }

  // Em PRODUÇÃO (EAS Build/Lojas), sempre força a URL da rotaBus
  if (!__DEV__) {
    return "https://rotabus-api.onrender.com";
  }

  // ==========================================
  // APENAS AMBIENTE LOCAL DE DESENVOLVIMENTO
  // ==========================================

  // No simulador iOS, localhost é a opção padrão quando não há URL externa
  if (__DEV__ && Platform.OS === "ios" && !Device.isDevice) {
    return "http://localhost:3000";
  }

  // Android Emulator
  if (Platform.OS === "android" && !Device.isDevice) {
    return "http://10.0.2.2:3000";
  }

  // Rastreador Automático de IP para Celulares Físicos (iPhone/Android via USB ou Wi-Fi)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    // hostUri vem no formato "192.168.0.x:8081". Extraímos só o IP.
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }

  // Fallback seguro
  return "http://localhost:3000";
}

export const API_BASE_URL = getBaseUrl();

console.log("[APIConfig] Servidor configurado em:", API_BASE_URL);
