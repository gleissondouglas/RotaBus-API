import { authService } from "../services/auth.service";
import { request } from "../utils/api";
import { API_BASE_URL } from "../config/api.config";

jest.mock("../utils/api", () => ({
  request: jest.fn(),
}));

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("deve enviar email e senha para o endpoint de login", async () => {
      const mockResponse = { token: "fake-jwt-token" };
      (request as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authService.login({ email: "test@test.com", password: "123" });

      expect(request).toHaveBeenCalledWith(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com", password: "123" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("createAccount", () => {
    it("deve criar conta e fazer login automaticamente em seguida", async () => {
      const mockAuthResponse = { token: "new-jwt-token" };
      
      // A primeira chamada de request é o POST /users
      (request as jest.Mock).mockResolvedValueOnce({});
      // A segunda chamada é o login
      (request as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const payload = {
        name: "Test User",
        email: "test@user.com",
        password: "secure123",
        confirmPassword: "secure123",
      };

      const result = await authService.createAccount(payload);

      // 1. Verifica criação de usuário
      expect(request).toHaveBeenNthCalledWith(1, `${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 2. Verifica login automático (senha não tem confirmação)
      expect(request).toHaveBeenNthCalledWith(2, `${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });

      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe("forgotPassword", () => {
    it("deve enviar o email para recuperar senha", async () => {
      (request as jest.Mock).mockResolvedValueOnce({ message: "Email enviado" });

      const result = await authService.forgotPassword("test@test.com");

      expect(request).toHaveBeenCalledWith(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      });
      expect(result).toEqual({ message: "Email enviado" });
    });
  });
});
