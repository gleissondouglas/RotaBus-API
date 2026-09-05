const axios = require("axios");
const crypto = require("crypto");
const { googleMapsApiKey } = require("../../../config/env");
const redisClient = require("../../../config/redis");

const SPEECH_CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 horas

/**
 * Transcreve um áudio em base64 usando a Google Cloud Speech-to-Text API.
 * @param {string} audioBase64 - O áudio em formato base64.
 * @param {string} mimeType - O mimeType do áudio (ex: audio/webm, audio/m4a).
 * @returns {Promise<string>} - O texto transcrito.
 */
async function transcribe(audioBase64, mimeType) {
  if (!googleMapsApiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY não configurada no backend.");
  }

  const audioHash = crypto.createHash("sha256").update(audioBase64 || "").digest("hex");
  const cacheKey = `speech:transcribe:${audioHash}`;

  try {
    const cachedTranscript = await redisClient.get(cacheKey);
    if (cachedTranscript !== null && cachedTranscript !== undefined) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[GoogleSpeechProvider] Retornando transcrição do cache: "${cacheKey}" -> "${cachedTranscript}"`);
      }
      return cachedTranscript;
    }
  } catch (cacheError) {
    console.error("[GoogleSpeechProvider] Erro ao ler cache de áudio:", cacheError.message);
  }

  const url = `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${googleMapsApiKey}`;

  const config = {
    languageCode: "pt-BR",
    enableAutomaticPunctuation: true,
    model: "default",
    useEnhanced: true,
  };

  if (mimeType && mimeType.includes("webm")) {
    config.encoding = "WEBM_OPUS";
    config.sampleRateHertz = 48000;
  } else {
    config.enableAutomaticEncodingDetection = true;
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[GoogleSpeechProvider] Tentativa ${attempt}/${maxRetries}. MimeType: ${mimeType}, Size: ${audioBase64.length}`,
        );
      }

      const response = await axios.post(
        url,
        {
          config,
          audio: {
            content: audioBase64,
          },
        },
        {
          // Tempo de timeout aumentado para 30 segundos
          timeout: 30000,
        },
      );

      const { results } = response.data;

      if (results && results.length > 0) {
        const transcript = results[0].alternatives[0].transcript;
        if (process.env.NODE_ENV !== "production") {
          console.log(`[GoogleSpeechProvider] Transcrição bem-sucedida: "${transcript}"`);
        }

        if (transcript && transcript.trim()) {
          try {
            await redisClient.set(cacheKey, transcript, "EX", SPEECH_CACHE_TTL_SECONDS);
          } catch (saveError) {
            console.error("[GoogleSpeechProvider] Erro ao salvar transcrição no cache:", saveError.message);
          }
        }

        return transcript;
      }

      console.warn("[GoogleSpeechProvider] Nenhum resultado encontrado na resposta da Google.");
      return "";
    } catch (error) {
      lastError = error;
      const isNetworkError =
        error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || !error.response;

      console.warn(`[GoogleSpeechProvider] Falha na tentativa ${attempt}`);

      if (!isNetworkError || attempt === maxRetries) {
        break;
      }

      // Espera curta antes de tentar novamente (backoff exponencial simples)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  console.error(
    "[GoogleSpeechProvider] Erro crítico na API do Google Speech.",
    lastError ? lastError.message : "",
  );
  throw new Error("Falha na comunicação com o serviço de transcrição.");
}

module.exports = {
  transcribe,
};
