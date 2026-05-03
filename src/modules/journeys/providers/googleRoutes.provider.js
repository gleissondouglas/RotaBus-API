const axios = require("axios");
const env = require("../../../config/env");

async function computeTransitRoute({ origin, destination, departureTime }) {
  if (!env.googleMapsApiKey) {
    const error = new Error("GOOGLE_MAPS_API_KEY não configurada.");
    error.statusCode = 500;
    throw error;
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
      address: destination.text,
    },
    travelMode: "TRANSIT",
    computeAlternativeRoutes: false,
    languageCode: "pt-BR",
    units: "METRIC",
  };

  if (departureTime) {
    body.departureTime = departureTime;
  }

  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.googleMapsApiKey,
        "X-Goog-FieldMask": [
          "routes.duration",
          "routes.distanceMeters",
          "routes.localizedValues",
          "routes.legs.steps.travelMode",
          "routes.legs.steps.distanceMeters",
          "routes.legs.steps.staticDuration",
          "routes.legs.steps.navigationInstruction",
          "routes.legs.steps.transitDetails",
        ].join(","),
      },
    });

    return response.data;
  } catch (axiosError) {
    let message = "Falha ao consultar Google Routes API.";
    let statusCode = 502;

    if (axiosError.response) {
      statusCode = axiosError.response.status || 502;

      if (
        axiosError.response.data &&
        axiosError.response.data.error &&
        axiosError.response.data.error.message
      ) {
        message = axiosError.response.data.error.message;
      }
    } else if (axiosError.message) {
      message = axiosError.message;
    }

    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }
}

module.exports = {
  computeTransitRoute,
};
