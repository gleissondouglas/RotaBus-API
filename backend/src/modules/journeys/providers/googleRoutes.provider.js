const axios = require("axios");
const env = require("../../../config/env");
const redisClient = require("../../../config/redis");

const WALKING_ROUTE_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias

function applyTimePreference(body, timePreference) {
  if (!timePreference || !timePreference.dateTime) {
    body.departureTime = new Date().toISOString();
    return;
  }

  if (timePreference.type === "ARRIVAL") {
    body.arrivalTime = timePreference.dateTime;
    return;
  }

  body.departureTime = timePreference.dateTime;
}

async function computeTransitRoute({ origin, destination, timePreference }) {
  if (!env.googleMapsApiKey) {
    const error = new Error("GOOGLE_MAPS_API_KEY não configurada.");
    error.statusCode = 500;
    throw error;
  }

  // O hack de detecção de simulador foi removido para que o app use
  // a localização real (mesmo que simulada) enviada pelo frontend.
  const finalOrigin = { ...origin };

  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

  const body = {
    origin: {
      location: {
        latLng: {
          latitude: finalOrigin.lat,
          longitude: finalOrigin.lng,
        },
      },
    },

    destination:
      destination.lat && destination.lng
        ? {
            location: {
              latLng: {
                latitude: destination.lat,
                longitude: destination.lng,
              },
            },
          }
        : {
            address: `${destination.text}, Uberaba - MG`,
          },

    travelMode: "TRANSIT",
    computeAlternativeRoutes: true,
    languageCode: "pt-BR",
    units: "METRIC",
    polylineQuality: "HIGH_QUALITY",
  };

  applyTimePreference(body, timePreference);

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[GoogleRoutes] Calculando rota transit...`);
    }

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.googleMapsApiKey,
        "X-Goog-FieldMask": [
          "routes.duration",
          "routes.distanceMeters",
          "routes.polyline",
          "routes.localizedValues",
          "routes.legs.steps.travelMode",
          "routes.legs.steps.distanceMeters",
          "routes.legs.steps.staticDuration",
          "routes.legs.steps.polyline",
          "routes.legs.steps.startLocation",
          "routes.legs.steps.endLocation",
          "routes.legs.steps.navigationInstruction",
          "routes.legs.steps.navigationInstruction.maneuver",
          "routes.legs.steps.transitDetails",
          "routes.legs.steps.transitDetails.stopDetails.departureTime",
          "routes.legs.steps.transitDetails.stopDetails.arrivalTime",
          "routes.legs.steps.transitDetails.stopDetails.departureStop",
          "routes.legs.steps.transitDetails.stopDetails.departureStop.location",
          "routes.legs.steps.transitDetails.stopDetails.arrivalStop",
          "routes.legs.steps.transitDetails.stopDetails.arrivalStop.location",
        ].join(","),
      },
    });

    return response.data;
  } catch (axiosError) {
    let message = "Não foi possível calcular a rota. Tente novamente mais tarde.";
    let statusCode = 502;

    if (axiosError.response) {
      statusCode = axiosError.response.status || 502;
      console.error(`[GoogleRoutes] Erro na API Google: ${statusCode}`);
    } else {
      console.error(`[GoogleRoutes] Erro de rede: ${axiosError.message}`);
    }

    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }
}

async function computeWalkingRoute({ origin, destination }) {
  if (!env.googleMapsApiKey) {
    throw new Error("GOOGLE_MAPS_BACKEND_API_KEY não configurada.");
  }

  const roundedOrigLat = Number(origin?.lat || 0).toFixed(4);
  const roundedOrigLng = Number(origin?.lng || 0).toFixed(4);
  const roundedDestLat = Number(destination?.lat || 0).toFixed(4);
  const roundedDestLng = Number(destination?.lng || 0).toFixed(4);
  const cacheKey = `route:walk:${roundedOrigLat},${roundedOrigLng}:${roundedDestLat},${roundedDestLng}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[GoogleRoutes] Retornando rota walking do cache: "${cacheKey}"`);
      }
      return JSON.parse(cachedData);
    }
  } catch (cacheError) {
    console.error("[GoogleRoutes] Erro ao ler cache de caminhada:", cacheError.message);
  }

  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

  const body = {
    origin: {
      location: {
        latLng: {
          latitude: origin.lat,
          longitude: origin.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
      },
    },
    travelMode: "WALK",
    languageCode: "pt-BR",
    units: "METRIC",
    polylineQuality: "HIGH_QUALITY",
  };

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[GoogleRoutes] Calculando rota walking...`);
    }

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.googleMapsApiKey,
        "X-Goog-FieldMask": [
          "routes.duration",
          "routes.distanceMeters",
          "routes.polyline",
          "routes.legs.steps.travelMode",
          "routes.legs.steps.distanceMeters",
          "routes.legs.steps.staticDuration",
          "routes.legs.steps.polyline",
          "routes.legs.steps.startLocation",
          "routes.legs.steps.endLocation",
          "routes.legs.steps.navigationInstruction",
          "routes.legs.steps.navigationInstruction.maneuver",
        ].join(","),
      },
    });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(response.data), "EX", WALKING_ROUTE_CACHE_TTL_SECONDS);
      } catch (saveCacheError) {
        console.error("[GoogleRoutes] Erro ao salvar rota walking no Redis:", saveCacheError.message);
      }
    }

    return response.data;
  } catch (axiosError) {
    console.error("[GoogleRoutes] Erro na rota a pé:", axiosError.message);
    return null;
  }
}

module.exports = {
  computeTransitRoute,
  computeWalkingRoute,
};
