const axios = require("axios");
const env = require("../../../config/env");
const redisClient = require("../../../config/redis");

const GEOCODE_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dias

async function getAddressFromCoordinates(lat, lng) {
  if (!env.googleMapsApiKey) {
    const error = new Error("GOOGLE_MAPS_API_KEY não configurada.");
    error.statusCode = 500;
    throw error;
  }

  const roundedLat = Number(lat).toFixed(4);
  const roundedLng = Number(lng).toFixed(4);
  const cacheKey = `geocode:reverse:${roundedLat},${roundedLng}`;

  try {
    const cachedAddress = await redisClient.get(cacheKey);
    if (cachedAddress) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[GeocodingProvider] Retornando do cache: "${cacheKey}"`);
      }
      return cachedAddress;
    }
  } catch (cacheError) {
    console.error("[GeocodingProvider] Erro ao ler do Redis:", cacheError.message);
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.googleMapsApiKey}&language=pt-BR`;

  try {
    const response = await axios.get(url);

    if (response.data.status === "ZERO_RESULTS") {
      return "Localização não identificada";
    }

    if (response.data.status !== "OK") {
      throw new Error(response.data.error_message || "Erro ao consultar Geocoding API");
    }

    // Retorna o primeiro endereço formatado (o mais preciso)
    const formattedAddress = response.data.results[0].formatted_address;

    try {
      await redisClient.set(cacheKey, formattedAddress, "EX", GEOCODE_CACHE_TTL_SECONDS);
    } catch (saveCacheError) {
      console.error("[GeocodingProvider] Erro ao salvar no Redis:", saveCacheError.message);
    }

    return formattedAddress;
  } catch (error) {
    console.error("Erro Geocoding Provider:", error.message);
    return "Localização não identificada";
  }
}

/**
 * Resolve um endereço a partir de texto (Forward Geocoding)
 * @param {string} address - Texto do endereço para buscar
 */
async function geocodeAddress(address) {
  if (!env.googleMapsApiKey) {
    const error = new Error("GOOGLE_MAPS_API_KEY não configurada.");
    error.statusCode = 500;
    throw error;
  }

  const cleanAddress = String(address).toLowerCase().trim();
  const cacheKey = `geocode:forward:${cleanAddress}`;

  try {
    const cachedResults = await redisClient.get(cacheKey);
    if (cachedResults) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[GeocodingProvider] Retornando do cache: "${cacheKey}"`);
      }
      return JSON.parse(cachedResults);
    }
  } catch (cacheError) {
    console.error("[GeocodingProvider] Erro ao ler do Redis:", cacheError.message);
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${env.googleMapsApiKey}&language=pt-BR&region=br`;

  try {
    const response = await axios.get(url);

    if (
      response.data.status === "ZERO_RESULTS" ||
      !response.data.results ||
      response.data.results.length === 0
    ) {
      return [];
    }

    if (response.data.status !== "OK") {
      throw new Error(response.data.error_message || "Erro ao consultar Geocoding API");
    }

    const mappedResults = response.data.results.map((result) => {
      const isUberaba = result.address_components.some((c) => c.long_name === "Uberaba");
      let type = "unknown";
      if (result.types.includes("street_address")) type = "street_address";
      else if (result.types.includes("route")) type = "street";
      else if (result.types.includes("sublocality")) type = "neighborhood";

      // Tentativa de separar o nome da rua para o UI
      const routeComponent = result.address_components.find((c) => c.types.includes("route"));
      const numberComponent = result.address_components.find((c) =>
        c.types.includes("street_number"),
      );

      let name = result.formatted_address.split(",")[0];
      if (routeComponent) {
        name = routeComponent.long_name;
        if (numberComponent) name += `, ${numberComponent.long_name}`;
      }

      let confidence = isUberaba ? "high" : "low";
      if (isUberaba && type === "street") confidence = "medium"; // Rua sem número
      if (isUberaba && type === "neighborhood") confidence = "medium"; // Apenas bairro

      return {
        id: result.place_id,
        name: name,
        address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        type: type,
        confidence: confidence,
        source: "GOOGLE_GEOCODING",
        isUberaba: isUberaba,
      };
    });

    if (mappedResults.length > 0) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(mappedResults), "EX", GEOCODE_CACHE_TTL_SECONDS);
      } catch (saveCacheError) {
        console.error("[GeocodingProvider] Erro ao salvar no Redis:", saveCacheError.message);
      }
    }

    return mappedResults;
  } catch (error) {
    console.error("[GeocodingProvider] Erro no geocodeAddress:", error.message);
    return [];
  }
}

module.exports = {
  getAddressFromCoordinates,
  geocodeAddress,
};
