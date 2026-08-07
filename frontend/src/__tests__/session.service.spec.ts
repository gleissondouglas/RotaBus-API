import { sessionService } from "../services/session.service";
import { appStorage } from "../services/storage.service";
import { AuthResponse, AuthUser } from "../types/auth.types";

jest.mock("../services/storage.service", () => ({
  appStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    deleteItem: jest.fn(),
  },
}));

describe("sessionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveAuthSession", () => {
    it("deve salvar token e usuario no storage com sucesso", async () => {
      const mockAuth: AuthResponse = {
        message: "ok",
        token: "jwt-123",
        user: { id: "1", name: "Douglas", email: "test@test.com" },
      };

      await sessionService.saveAuthSession(mockAuth);

      expect(appStorage.setItem).toHaveBeenNthCalledWith(1, "nuvem_token", "jwt-123");
      expect(appStorage.setItem).toHaveBeenNthCalledWith(2, "nuvem_user", JSON.stringify(mockAuth.user));
    });

    it("deve lancar erro se não houver token", async () => {
      const mockAuth = { user: { id: "1", name: "D" } } as any;

      await expect(sessionService.saveAuthSession(mockAuth)).rejects.toThrow("Token não recebido.");
      expect(appStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("getUser e getToken", () => {
    it("deve retornar o usuario decodificado do storage", async () => {
      const mockUser = { id: "1", name: "Douglas" };
      (appStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockUser));

      const result = await sessionService.getUser();
      expect(result).toEqual(mockUser);
    });

    it("deve retornar null se o storage retornar null", async () => {
      (appStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await sessionService.getUser();
      expect(result).toBeNull();
    });

    it("deve retornar o token do storage", async () => {
      (appStorage.getItem as jest.Mock).mockResolvedValueOnce("meu-token");

      const result = await sessionService.getToken();
      expect(result).toBe("meu-token");
    });
  });

  describe("clearSession", () => {
    it("deve remover todas as chaves do storage na limpeza", async () => {
      await sessionService.clearSession();

      expect(appStorage.deleteItem).toHaveBeenCalledWith("nuvem_token");
      expect(appStorage.deleteItem).toHaveBeenCalledWith("nuvem_user");
      expect(appStorage.deleteItem).toHaveBeenCalledWith("nuvem_permissions_seen");
      expect(appStorage.deleteItem).toHaveBeenCalledWith("nuvem_session_id");
    });
  });
});
