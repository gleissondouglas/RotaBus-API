const axios = require("axios");
const redisClient = require("../../../../src/config/redis");
const {
  computeWalkingRoute,
} = require("../../../../src/modules/journeys/providers/googleRoutes.provider");

jest.mock("axios");
jest.mock("../../../../src/config/redis", () => {
  const store = new Map();
  return {
    get: jest.fn().mockImplementation(async (key) => store.get(key) || null),
    set: jest.fn().mockImplementation(async (key, value) => {
      store.set(key, value);
    }),
    __store: store,
  };
});
jest.mock("../../../../src/config/env", () => ({
  googleMapsApiKey: "test-api-key",
}));

describe("googleRoutes.provider (com Cache de Caminhada no Redis)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.__store.clear();
  });

  it("deve retornar rota a pé do cache se já existir", async () => {
    const origin = { lat: -19.7472, lng: -47.9392 };
    const destination = { lat: -19.7490, lng: -47.9350 };
    const expectedKey = "route:walk:-19.7472,-47.9392:-19.7490,-47.9350";

    const cachedRouteData = {
      routes: [{ duration: "300s", distanceMeters: 400 }],
    };
    redisClient.__store.set(expectedKey, JSON.stringify(cachedRouteData));

    const result = await computeWalkingRoute({ origin, destination });

    expect(result).toEqual(cachedRouteData);
    expect(redisClient.get).toHaveBeenCalledWith(expectedKey);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("deve chamar a API do Google Routes e salvar no Redis com TTL de 7 dias em caso de miss", async () => {
    const origin = { lat: -19.7472, lng: -47.9392 };
    const destination = { lat: -19.7500, lng: -47.9400 };
    const expectedKey = "route:walk:-19.7472,-47.9392:-19.7500,-47.9400";

    const apiResponseData = {
      routes: [
        {
          duration: "450s",
          distanceMeters: 600,
          legs: [],
        },
      ],
    };

    axios.post.mockResolvedValue({ data: apiResponseData });

    const result = await computeWalkingRoute({ origin, destination });

    expect(result).toEqual(apiResponseData);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      expectedKey,
      JSON.stringify(apiResponseData),
      "EX",
      7 * 24 * 60 * 60
    );
  });

  it("deve continuar normalmente se o Redis falhar na leitura", async () => {
    redisClient.get.mockRejectedValueOnce(new Error("Redis indisponível"));
    const origin = { lat: -19.7, lng: -47.9 };
    const destination = { lat: -19.8, lng: -48.0 };

    const apiResponseData = { routes: [{ duration: "600s" }] };
    axios.post.mockResolvedValue({ data: apiResponseData });

    const result = await computeWalkingRoute({ origin, destination });

    expect(result).toEqual(apiResponseData);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});
