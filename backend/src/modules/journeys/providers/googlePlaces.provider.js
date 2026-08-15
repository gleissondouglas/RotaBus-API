const axios = require("axios");
const env = require("../../../config/env");
const redisClient = require("../../../config/redis");

/**
 * Busca lugares usando a Google Places API (New) - Text Search.
 * Endpoint: POST https://places.googleapis.com/v1/places:searchText
 */
async function searchPlaces(query, origin) {
  if (!env.googleMapsApiKey) {
    const error = new Error("GOOGLE_MAPS_API_KEY não configurada no ambiente.");
    error.statusCode = 500;
    throw error;
  }

  // Cria uma chave única no Redis. O Cache ignora a origem para maximizar o reúso,
  // exatamente como sugerido (o "Centro" é o mesmo independente de onde o usuário está).
  const cacheKey = `places:${query.toLowerCase().trim()}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[GooglePlaces] Retornando do cache do Redis para a busca: "${query}"`);
      }
      return JSON.parse(cachedData);
    }
  } catch (cacheError) {
    console.error("[GooglePlaces] Erro ao ler do Redis:", cacheError.message);
  }

  // Configuração de Uberaba como centro padrão para viés de localização
  const UBERABA_CENTER = { latitude: -19.7472, longitude: -47.9392 };

  // Se tiver origem do usuário, usa ela, senão usa o centro de Uberaba
  const biasCenter =
    origin && origin.lat && origin.lng
      ? { latitude: origin.lat, longitude: origin.lng }
      : UBERABA_CENTER;

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[GooglePlaces] Buscando destino: "${query}" | Bias: ${biasCenter.latitude},${biasCenter.longitude}`,
    );
  }

  try {
    const url = "https://places.googleapis.com/v1/places:searchText";

    const response = await axios.post(
      url,
      {
        textQuery: query, // Removido Uberaba MG fixo daqui para o Places API usar o bias corretamente
        languageCode: "pt-BR",
        regionCode: "BR",
        maxResultCount: 10,
        locationBias: {
          circle: {
            center: biasCenter,
            radius: 15000.0, // 15km para cobrir Uberaba inteira com folga
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": env.googleMapsApiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types",
        },
      },
    );

    const places = response.data.places || [];

    if (process.env.NODE_ENV !== "production") {
      console.log(`[GooglePlaces] API New retornou ${places.length} resultados.`);
      if (places.length > 0) {
        console.log(`[GooglePlaces] Primeira opção: "${places[0].displayName?.text}"`);
      }
    }

    const result = places.map((place) => ({
      id: place.id,
      name: place.displayName?.text || "Local sem nome",
      address: place.formattedAddress,
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      confidence: 1.0,
      source: "GOOGLE_PLACES_NEW",
    }));

    // Salva o resultado no Redis com TTL de 30 dias (30 * 24 * 60 * 60 segundos)
    try {
      await redisClient.setex(cacheKey, 30 * 24 * 60 * 60, JSON.stringify(result));
    } catch (cacheError) {
      console.error("[GooglePlaces] Erro ao salvar no Redis:", cacheError.message);
    }

    return result;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;

      console.error(`[GooglePlaces] Erro da API Google (${status})`);

      if (status === 403) {
        const authError = new Error(
          "A chave do Google não está autorizada para Places API (New). Verifique as restrições da chave no Google Cloud.",
        );
        authError.statusCode = 403;
        throw authError;
      }

      if (status === 400) {
        const badRequestError = new Error(
          "Requisição inválida para o Google Places. Verifique o payload enviado.",
        );
        badRequestError.statusCode = 400;
        throw badRequestError;
      }
    }

    console.error("[GooglePlaces] Erro na comunicação com Google");
    throw error;
  }
}

module.exports = {
  searchPlaces,
};
