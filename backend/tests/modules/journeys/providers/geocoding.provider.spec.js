const axios = require("axios");
const redisClient = require("../../../../src/config/redis");
const {
  getAddressFromCoordinates,
  geocodeAddress,
} = require("../../../../src/modules/journeys/providers/geocoding.provider");

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

describe("geocoding.provider (com Cache Redis)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.__store.clear();
  });

  describe("getAddressFromCoordinates (Reverse Geocoding)", () => {
    it("deve retornar endereço do cache do Redis se já existir, sem chamar a API", async () => {
      const lat = -19.74723;
      const lng = -47.93921;
      const expectedKey = "geocode:reverse:-19.7472,-47.9392";
      redisClient.__store.set(expectedKey, "Rua do Carmo, 100 - Centro");

      const result = await getAddressFromCoordinates(lat, lng);

      expect(result).toBe("Rua do Carmo, 100 - Centro");
      expect(redisClient.get).toHaveBeenCalledWith(expectedKey);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("deve chamar a API do Google e salvar no Redis em caso de cache miss", async () => {
      const lat = -19.7472;
      const lng = -47.9392;
      const expectedKey = "geocode:reverse:-19.7472,-47.9392";

      axios.get.mockResolvedValue({
        data: {
          status: "OK",
          results: [{ formatted_address: "Av. Leopoldino de Oliveira, 500" }],
        },
      });

      const result = await getAddressFromCoordinates(lat, lng);

      expect(result).toBe("Av. Leopoldino de Oliveira, 500");
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(redisClient.set).toHaveBeenCalledWith(
        expectedKey,
        "Av. Leopoldino de Oliveira, 500",
        "EX",
        30 * 24 * 60 * 60
      );
    });

    it("deve continuar funcionando normalmente se o Redis falhar na leitura", async () => {
      redisClient.get.mockRejectedValueOnce(new Error("Redis offline"));
      axios.get.mockResolvedValue({
        data: {
          status: "OK",
          results: [{ formatted_address: "Rua das Flores, 12" }],
        },
      });

      const result = await getAddressFromCoordinates(-19.7, -47.9);
      expect(result).toBe("Rua das Flores, 12");
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("geocodeAddress (Forward Geocoding)", () => {
    it("deve retornar lista do cache se a busca já foi realizada", async () => {
      const address = "Rua Tristão de Castro";
      const expectedKey = "geocode:forward:rua tristão de castro";
      const cachedList = [
        {
          id: "place-1",
          name: "Rua Tristão de Castro",
          address: "Rua Tristão de Castro, Uberaba - MG",
          lat: -19.75,
          lng: -47.93,
        },
      ];
      redisClient.__store.set(expectedKey, JSON.stringify(cachedList));

      const result = await geocodeAddress(address);

      expect(result).toEqual(cachedList);
      expect(redisClient.get).toHaveBeenCalledWith(expectedKey);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("deve consultar API e salvar no Redis em caso de cache miss", async () => {
      const address = "Rua Major Eustáquio";
      const expectedKey = "geocode:forward:rua major eustáquio";

      axios.get.mockResolvedValue({
        data: {
          status: "OK",
          results: [
            {
              place_id: "major-123",
              formatted_address: "Rua Major Eustáquio, 200, Uberaba - MG",
              address_components: [
                { long_name: "Uberaba", types: ["administrative_area_level_2"] },
                { long_name: "Rua Major Eustáquio", types: ["route"] },
                { long_name: "200", types: ["street_number"] },
              ],
              geometry: { location: { lat: -19.748, lng: -47.935 } },
              types: ["street_address"],
            },
          ],
        },
      });

      const result = await geocodeAddress(address);

      expect(result.length).toBe(1);
      expect(result[0].name).toBe("Rua Major Eustáquio, 200");
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(redisClient.set).toHaveBeenCalledWith(
        expectedKey,
        expect.any(String),
        "EX",
        30 * 24 * 60 * 60
      );
    });
  });
});
