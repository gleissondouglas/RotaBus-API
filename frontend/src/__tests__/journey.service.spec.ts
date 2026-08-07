import { journeyService } from "../services/journey.service";
import { sessionService } from "../services/session.service";
import { cache } from "../utils/cache";
import { withRetry } from "../utils/network";
import { request } from "../utils/api";

jest.mock("../services/session.service", () => ({
  sessionService: {
    getToken: jest.fn().mockResolvedValue("fake-token"),
    getSessionId: jest.fn().mockReturnValue("fake-session-id"),
    setSessionId: jest.fn(),
    clearSessionId: jest.fn(),
  },
}));

jest.mock("../utils/cache", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock("../utils/network", () => ({
  withRetry: jest.fn((fn) => fn()),
}));

jest.mock("../utils/api", () => ({
  request: jest.fn(),
}));

describe("journeyService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("planJourney", () => {
    const mockRequest = {
      origin: { lat: -19, lng: -47 },
      destination: { text: "Shopping" },
    };

    it("deve retornar rota do cache se existir (Evita custo desnecessário)", async () => {
      const mockCachedResponse = { summary: { busLines: ["100"] } };
      (cache.get as jest.Mock).mockResolvedValueOnce(mockCachedResponse);

      const result = await journeyService.planJourney(mockRequest);

      expect(cache.get).toHaveBeenCalled();
      expect(request).not.toHaveBeenCalled(); // Não faz requisição real
      expect(result).toEqual(mockCachedResponse);
    });

    it("deve fazer requisição à API se o cache estiver vazio e salvar sessionId", async () => {
      (cache.get as jest.Mock).mockResolvedValueOnce(null);
      const mockApiResponse = { metadata: { sessionId: "new-session" } };
      (request as jest.Mock).mockResolvedValueOnce(mockApiResponse);

      const result = await journeyService.planJourney(mockRequest);

      expect(request).toHaveBeenCalled();
      expect(sessionService.setSessionId).toHaveBeenCalledWith("new-session");
      expect(cache.set).toHaveBeenCalled(); // Salva no cache
      expect(result).toEqual(mockApiResponse);
    });

    it("deve limpar o sessionId local se o servidor disser que a sessão expirou", async () => {
      (cache.get as jest.Mock).mockResolvedValueOnce(null);
      (request as jest.Mock).mockRejectedValueOnce(new Error("Sessão conversacional não encontrada"));

      await expect(journeyService.planJourney(mockRequest)).rejects.toThrow("Sessão conversacional não encontrada");

      // Gatilho de segurança e recuperação
      expect(sessionService.clearSessionId).toHaveBeenCalled();
    });
  });

  describe("resolveDestination", () => {
    const mockDestRequest = {
      text: "centro",
      origin: { lat: -19, lng: -47 },
    };

    it("deve bater no cache antes da API para destinos", async () => {
      const mockCachedDest = { options: [] };
      (cache.get as jest.Mock).mockResolvedValueOnce(mockCachedDest);

      const result = await journeyService.resolveDestination(mockDestRequest);

      expect(cache.get).toHaveBeenCalled();
      expect(request).not.toHaveBeenCalled();
      expect(result).toEqual(mockCachedDest);
    });
  });
});
