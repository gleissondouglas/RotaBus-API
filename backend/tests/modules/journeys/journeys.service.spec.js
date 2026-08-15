const {
  planJourney,
  reverseGeocodeService,
  transcribeAudioService,
  resolveDestinationService,
} = require("../../../src/modules/journeys/journeys.service");

// Mocks
jest.mock("../../../src/modules/journeys/journeys.validator", () => ({
  validatePlanJourneyInput: jest.fn().mockImplementation((data) => data),
  validateResolveDestinationInput: jest.fn().mockImplementation((data) => data),
}));

jest.mock("../../../src/modules/journeys/providers/routes.provider", () => ({
  computeTransitRoute: jest.fn(),
  computeWalkingRoute: jest.fn(),
}));

jest.mock("../../../src/modules/journeys/journey.mapper", () => ({
  mapGoogleRouteToJourney: jest.fn(),
  mapWalkingOnlyRouteToJourney: jest.fn(),
}));

jest.mock("../../../src/modules/journeys/route-cache", () => ({
  findCachedRoute: jest.fn(),
  createRouteCache: jest.fn(),
}));

jest.mock("../../../src/modules/journeys/providers/geocoding.provider", () => ({
  getAddressFromCoordinates: jest.fn(),
  geocodeAddress: jest.fn(),
}));

jest.mock("../../../src/modules/journeys/providers/speech.provider", () => ({
  transcribe: jest.fn(),
}));

jest.mock("../../../src/modules/journeys/providers/destination.provider", () => ({
  getDestinationContext: jest.fn(),
  searchPlaces: jest.fn(),
}));

jest.mock("../../../src/modules/journeys/local-intelligence/local-intelligence.service", () => ({
  applyLocalAliases: jest.fn().mockImplementation((text) => text),
  guessQueryType: jest.fn().mockReturnValue("specific_place"),
  checkIfGenericCity: jest.fn().mockReturnValue(false),
  evaluateConfidence: jest.fn().mockReturnValue("high"),
  shouldShowOptionsForKnownTerm: jest.fn().mockReturnValue(false),
}));

const routesProvider = require("../../../src/modules/journeys/providers/routes.provider");
const journeyMapper = require("../../../src/modules/journeys/journey.mapper");
const routeCache = require("../../../src/modules/journeys/route-cache");
const geocodingProvider = require("../../../src/modules/journeys/providers/geocoding.provider");
const speechProvider = require("../../../src/modules/journeys/providers/speech.provider");

describe("Journeys Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reverseGeocodeService", () => {
    it("deve retornar o endereço correto", async () => {
      geocodingProvider.getAddressFromCoordinates.mockResolvedValue("Rua Teste, 123");
      const result = await reverseGeocodeService({ lat: -10, lng: -20 });
      expect(result).toEqual({ address: "Rua Teste, 123" });
    });

    it("deve lançar erro se lat ou lng faltarem", async () => {
      await expect(reverseGeocodeService({ lat: undefined, lng: -20 })).rejects.toThrow("Latitude e longitude são obrigatórias.");
    });
  });

  describe("transcribeAudioService", () => {
    it("deve retornar o texto transcrito", async () => {
      speechProvider.transcribe.mockResolvedValue("Quero ir para o centro");
      const result = await transcribeAudioService({ audioBase64: "dGVzdGU=", mimeType: "audio/m4a" });
      expect(result).toEqual({ text: "Quero ir para o centro" });
    });

    it("deve lançar erro se o áudio não for enviado", async () => {
      await expect(transcribeAudioService({ audioBase64: "" })).rejects.toThrow("Áudio em base64 é obrigatório.");
    });
  });

  describe("resolveDestinationService", () => {
    it("deve limpar o texto e buscar no places", async () => {
      const destinationProvider = require("../../../src/modules/journeys/providers/destination.provider");
      destinationProvider.searchPlaces.mockResolvedValue([
        {
          name: "Hospital de Teste",
          address: "Rua H, Uberaba",
          location: { lat: 1, lng: 1 },
          placeId: "123",
          category: "hospital",
        },
      ]);
      const result = await resolveDestinationService({
        text: "me leva ao hospital",
        origin: { lat: 0, lng: 0 }
      });

      expect(destinationProvider.searchPlaces).toHaveBeenCalledWith(
        "hospital",
        { lat: 0, lng: 0 }
      );
      expect(result.resolvedDestination.name).toBe("Hospital de Teste");
    });
  });

  describe("planJourney", () => {
    const defaultParams = {
      origin: { lat: -19, lng: -47 },
      destination: { lat: -20, lng: -48, name: "Destino" },
      timePreference: { type: "DEPARTURE", dateTime: "2026-08-15T12:00:00Z" }
    };

    it("deve retornar a rota do cache se existir", async () => {
      routeCache.findCachedRoute.mockResolvedValue({
        googleResponse: { id: "cached_route" },
        timePreference: defaultParams.timePreference
      });

      journeyMapper.mapGoogleRouteToJourney.mockReturnValue({
        summary: { totalDurationMin: 10 }
      });

      const result = await planJourney(defaultParams);

      expect(routeCache.findCachedRoute).toHaveBeenCalled();
      expect(result.source).toBe("CACHE");
      expect(result.journey.summary.totalDurationMin).toBe(10);
    });

    it("deve chamar a API do provedor e salvar no cache se não existir", async () => {
      routeCache.findCachedRoute.mockResolvedValue(null);
      routesProvider.computeTransitRoute.mockResolvedValue({
        routes: [{ duration: "1000s" }]
      });
      journeyMapper.mapGoogleRouteToJourney.mockReturnValue({
        summary: { totalDurationMin: 16 }
      });

      const result = await planJourney(defaultParams);

      expect(routesProvider.computeTransitRoute).toHaveBeenCalled();
      expect(routeCache.createRouteCache).toHaveBeenCalled();
      expect(result.source).toBe("PROVIDER");
      expect(result.journey.summary.totalDurationMin).toBe(16);
    });
  });
});
