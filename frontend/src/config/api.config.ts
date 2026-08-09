import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

function getBaseUrl() {
  const extraApiUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  
  // No simulador iOS, localhost costuma ser mais estável que o IP externo
  if (__DEV__ && Platform.OS === "ios" && !Device.isDevice) {
    return "http://localhost:3000";
  }

  // Em PRODUÇÃO (EAS Build/Lojas), sempre força a URL da nuvem
  if (!__DEV__) {
    return (extraApiUrl && !extraApiUrl.includes("localhost") && !extraApiUrl.includes("192.168.")) 
      ? extraApiUrl 
      : "https://rotabus-api.onrender.com";
  }

  // ==========================================
  // APENAS AMBIENTE LOCAL DE DESENVOLVIMENTO
  // ==========================================

  // Se configurou ngrok ou Render no .env local, usa ela
  if (extraApiUrl && (extraApiUrl.includes("ngrok") || extraApiUrl.includes("onrender"))) {
    return extraApiUrl;
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
  return extraApiUrl || "http://localhost:3000";
}

export const API_BASE_URL = getBaseUrl();

console.log("[APIConfig] Servidor configurado em:", API_BASE_URL);
