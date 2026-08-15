import { request } from "../utils/api";
import { sessionService } from "../services/session.service";
import { Alert } from "react-native";

jest.mock("../services/session.service", () => ({
  sessionService: {
    clearSession: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("react-native", () => {
  const rn = jest.requireActual("react-native");
  rn.Alert.alert = jest.fn();
  return rn;
});

// Mock do global fetch
global.fetch = jest.fn();

describe("api helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar o json em caso de sucesso (200)", async () => {
    const mockResponse = { data: "test" };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await request("http://test.com/api");
    expect(result).toEqual(mockResponse);
  });

  it("deve disparar erro comum quando a api retorna status ruim diferente de 401", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad request error" }),
    });

    await expect(request("http://test.com/api")).rejects.toThrow("Bad request error");
  });

  it("deve interceptar erro 401 e deslogar o usuário (Segurança de Sessão)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    });

    await expect(request("http://test.com/api/protected-route")).rejects.toThrow("Sessão expirada.");
    
    // Verifica os gatilhos de segurança
    expect(sessionService.clearSession).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Sessão Expirada",
      "Sua sessão expirou por segurança. Por favor, entre novamente.",
      expect.any(Array)
    );
  });

  it("NÃO deve deslogar e exibir alert se o 401 vier da própria rota de login", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Credenciais inválidas" }),
    });

    await expect(request("http://test.com/api/auth/login")).rejects.toThrow("Credenciais inválidas");
    
    // Não deve acionar a segurança de deslogamento
    expect(sessionService.clearSession).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
