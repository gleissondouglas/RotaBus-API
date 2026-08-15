import { sessionService } from "../services/session.service";
import { appStorage } from "../services/storage.service";
import { AuthResponse, AuthUser } from "../types/auth.types";

jest.mock("../services/storage.service", () => ({
  appStorage: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    deleteItem: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("sessionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (appStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (appStorage.getItem as jest.Mock).mockResolvedValue(null);
    (appStorage.deleteItem as jest.Mock).mockResolvedValue(undefined);
    sessionService.setSessionId(null);
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
      expect(appStorage.setItem).toHaveBeenNthCalledWith(1, "rotaBus_token", "jwt-123");
      expect(appStorage.setItem).toHaveBeenNthCalledWith(2, "rotaBus_user", JSON.stringify(mockAuth.user));
    });

    it("deve lancar erro se não houver token", async () => {
      const mockAuth = { user: { id: "1", name: "D" } } as any;
      await expect(sessionService.saveAuthSession(mockAuth)).rejects.toThrow("Token não recebido.");
      expect(appStorage.setItem).not.toHaveBeenCalled();
    });

    it("deve lançar erro se não houver usuário", async () => {
      const mockAuth = { token: "jwt-123" } as any;
      await expect(sessionService.saveAuthSession(mockAuth)).rejects.toThrow("Usuário não recebido.");
      expect(appStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("updateUserSession", () => {
    it("deve atualizar o usuario no storage com sucesso", async () => {
      const mockUser: AuthUser = { id: "1", name: "Douglas", email: "test@test.com" };
      await sessionService.updateUserSession(mockUser);
      expect(appStorage.setItem).toHaveBeenCalledWith("rotaBus_user", JSON.stringify(mockUser));
    });

    it("deve propagar erro se o storage falhar ao atualizar usuário", async () => {
      const mockUser: AuthUser = { id: "1", name: "Douglas", email: "test@test.com" };
      (appStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("Erro ao salvar no storage"));
      await expect(sessionService.updateUserSession(mockUser)).rejects.toThrow("Erro ao salvar no storage");
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

    it("deve retornar null se o JSON.parse falhar ao obter usuário", async () => {
      (appStorage.getItem as jest.Mock).mockResolvedValueOnce("invalid-json{");
      const result = await sessionService.getUser();
      expect(result).toBeNull();
    });

    it("deve retornar null se o storage lançar erro ao obter usuário", async () => {
      (appStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error("Storage error"));
      const result = await sessionService.getUser();
      expect(result).toBeNull();
    });

    it("deve retornar o token do storage", async () => {
      (appStorage.getItem as jest.Mock).mockResolvedValueOnce("meu-token");
      const result = await sessionService.getToken();
      expect(result).toBe("meu-token");
    });

    it("deve retornar null se o storage lançar erro ao obter token", async () => {
      (appStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error("Storage error"));
      const result = await sessionService.getToken();
      expect(result).toBeNull();
    });
  });

  describe("setHasSeenPermissions e getHasSeenPermissions", () => {
    it("deve salvar true no storage para permissões vistas", async () => {
      await sessionService.setHasSeenPermissions(true);
      expect(appStorage.setItem).toHaveBeenCalledWith("rotaBus_permissions_seen", "true");
    });

    it("deve salvar false no storage para permissões vistas", async () => {
      await sessionService.setHasSeenPermissions(false);
      expect(appStorage.setItem).toHaveBeenCalledWith("rotaBus_permissions_seen", "false");
    });

    it("deve ignorar erro silenciosamente ao salvar permissões vistas", async () => {
      (appStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("Storage error"));
      await expect(sessionService.setHasSeenPermissions(true)).resolves.not.toThrow();
    });

    it("deve retornar true quando storage retornar 'true'", async () => {
      (appStorage.getItem as jest.Mock).mockResolvedValueOnce("true");
      const result = await sessionService.getHasSeenPermissions();
      expect(result).toBe(true);
    });

    it("deve retornar false quando storage retornar outro valor diferente de 'true'", async () => {
      (appStorage.getItem as jest.Mock).mockResolvedValueOnce("false");
      const result = await sessionService.getHasSeenPermissions();
      expect(result).toBe(false);
    });

    it("deve retornar false quando storage retornar null para permissões", async () => {
      (appStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const result = await sessionService.getHasSeenPermissions();
      expect(result).toBe(false);
    });

    it("deve retornar false quando storage lançar erro ao obter permissões", async () => {
      (appStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error("Storage error"));
      const result = await sessionService.getHasSeenPermissions();
      expect(result).toBe(false);
    });
  });

  describe("clearSession", () => {
    it("deve remover todas as chaves do storage na limpeza", async () => {
      await sessionService.clearSession();
      expect(appStorage.deleteItem).toHaveBeenCalledWith("rotaBus_token");
      expect(appStorage.deleteItem).toHaveBeenCalledWith("rotaBus_user");
      expect(appStorage.deleteItem).toHaveBeenCalledWith("rotaBus_permissions_seen");
      expect(appStorage.deleteItem).toHaveBeenCalledWith("rotaBus_session_id");
      expect(sessionService.getSessionId()).toBeNull();
    });

    it("deve ignorar erro silenciosamente caso a limpeza do storage falhe", async () => {
      (appStorage.deleteItem as jest.Mock).mockRejectedValueOnce(new Error("Delete error"));
      await expect(sessionService.clearSession()).resolves.not.toThrow();
    });
  });

  describe("sessionId (setSessionId, getSessionId, clearSessionId, restoreSessionId)", () => {
    it("deve salvar id no storage e na variável interna ao definir sessionId com string", () => {
      (appStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
      sessionService.setSessionId("sess-123");
      expect(sessionService.getSessionId()).toBe("sess-123");
      expect(appStorage.setItem).toHaveBeenCalledWith("rotaBus_session_id", "sess-123");
    });

    it("deve deletar do storage e limpar variável interna ao definir sessionId com null", () => {
      (appStorage.deleteItem as jest.Mock).mockResolvedValueOnce(undefined);
      sessionService.setSessionId("sess-123");
      sessionService.setSessionId(null);
      expect(sessionService.getSessionId()).toBeNull();
      expect(appStorage.deleteItem).toHaveBeenCalledWith("rotaBus_session_id");
    });

    it("deve ignorar erro na promise ao falhar setItem no setSessionId", () => {
      (appStorage.setItem as jest.Mock).mockReturnValueOnce(Promise.reject(new Error("Storage error")));
      expect(() => sessionService.setSessionId("sess-err")).not.toThrow();
      expect(sessionService.getSessionId()).toBe("sess-err");
    });

    it("deve ignorar erro na promise ao falhar deleteItem no setSessionId(null)", () => {
      (appStorage.deleteItem as jest.Mock).mockReturnValueOnce(Promise.reject(new Error("Storage error")));
      expect(() => sessionService.setSessionId(null)).not.toThrow();
      expect(sessionService.getSessionId()).toBeNull();
    });

    it("deve retornar o sessionId atual com getSessionId", () => {
      sessionService.setSessionId("sess-999");
      expect(sessionService.getSessionId()).toBe("sess-999");
    });

    it("deve limpar o sessionId e deletar do storage com clearSessionId", () => {
      (appStorage.deleteItem as jest.Mock).mockResolvedValueOnce(undefined);
      sessionService.setSessionId("sess-abc");
      sessionService.clearSessionId();
      expect(sessionService.getSessionId()).toBeNull();
      expect(appStorage.deleteItem).toHaveBeenCalledWith("rotaBus_session_id");
    });

    it("deve ignorar erro na promise no clearSessionId", () => {
      (appStorage.deleteItem as jest.Mock).mockReturnValueOnce(Promise.reject(new Error("Storage error")));
      sessionService.setSessionId("sess-abc");
      expect(() => sessionService.clearSessionId()).not.toThrow();
      expect(sessionService.getSessionId()).toBeNull();
    });

    it("deve restaurar o sessionId do storage com sucesso", async () => {
      (appStorage.getItem as jest.Mock).mockResolvedValueOnce("restored-session-id");
      const result = await sessionService.restoreSessionId();
      expect(result).toBe("restored-session-id");
      expect(sessionService.getSessionId()).toBe("restored-session-id");
      expect(appStorage.getItem).toHaveBeenCalledWith("rotaBus_session_id");
    });

    it("deve retornar null se o storage lançar erro ao restaurar sessionId", async () => {
      (appStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error("Storage error"));
      const result = await sessionService.restoreSessionId();
      expect(result).toBeNull();
    });
  });
});
