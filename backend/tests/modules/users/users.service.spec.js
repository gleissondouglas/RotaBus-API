const usersService = require("../../../src/modules/users/users.service");
const usersRepository = require("../../../src/modules/users/users.repository");
const hashProvider = require("../../../src/shared/providers/hash.provider");
const apiUsageRepository = require("../../../src/shared/repositories/apiUsage.repository");

jest.mock("../../../src/modules/users/users.repository");
jest.mock("../../../src/shared/providers/hash.provider");
jest.mock("../../../src/shared/repositories/apiUsage.repository");

describe("Users Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUserService", () => {
    const validData = { name: "Test User", email: "test@test.com", password: "Password123!" };

    it("should throw 409 if email already exists", async () => {
      usersRepository.findUserByEmail.mockResolvedValue({ id: 1, email: "test@test.com" });

      await expect(usersService.createUserService(validData)).rejects.toThrow("Já existe um usuário com esse email.");
    });

    it("should create user and hash password", async () => {
      usersRepository.findUserByEmail.mockResolvedValue(null);
      hashProvider.generateHash.mockResolvedValue("hashedPassword");
      usersRepository.createUser.mockResolvedValue({ id: 1, name: "Test User", email: "test@test.com" });

      const result = await usersService.createUserService(validData);

      expect(hashProvider.generateHash).toHaveBeenCalledWith(validData.password);
      expect(usersRepository.createUser).toHaveBeenCalledWith({
        name: validData.name,
        email: validData.email,
        passwordHash: "hashedPassword",
      });
      expect(result.message).toBe("Usuário criado com sucesso!");
      expect(result.user.id).toBe(1);
    });
  });

  describe("listUsersService", () => {
    it("should list all users", async () => {
      const mockUsers = [{ id: 1, name: "User 1" }, { id: 2, name: "User 2" }];
      usersRepository.findAllUsers.mockResolvedValue(mockUsers);

      const result = await usersService.listUsersService();

      expect(usersRepository.findAllUsers).toHaveBeenCalled();
      expect(result.message).toBe("Usuários encontrados com sucesso!");
      expect(result.users).toEqual(mockUsers);
    });
  });

  describe("getProfileService", () => {
    it("should throw 404 if user not found", async () => {
      usersRepository.findUserById.mockResolvedValue(null);

      await expect(usersService.getProfileService(999)).rejects.toThrow("Usuário não encontrado.");
    });

    it("should return profile if user exists", async () => {
      const mockUser = { id: 1, name: "Test User" };
      usersRepository.findUserById.mockResolvedValue(mockUser);

      const result = await usersService.getProfileService(1);

      expect(result.message).toBe("Perfil encontrado com sucesso!");
      expect(result.user).toEqual(mockUser);
    });
  });

  describe("deleteUserService", () => {
    it("should throw 400 for invalid user ID (non-number)", async () => {
      await expect(usersService.deleteUserService({ userIdToDelete: "invalid", authenticatedUserId: 2 }))
        .rejects.toThrow("ID do usuário inválido!");
    });

    it("should throw 400 for invalid user ID (<= 0)", async () => {
      await expect(usersService.deleteUserService({ userIdToDelete: 0, authenticatedUserId: 2 }))
        .rejects.toThrow("ID do usuário inválido!");
    });

    it("should throw 400 if user tries to delete themselves through admin route", async () => {
      await expect(usersService.deleteUserService({ userIdToDelete: 1, authenticatedUserId: 1 }))
        .rejects.toThrow("Você não pode deletar sua própria conta de administrador por essa rota!");
    });

    it("should throw 404 if user does not exist", async () => {
      usersRepository.findUserById.mockResolvedValue(null);

      await expect(usersService.deleteUserService({ userIdToDelete: 2, authenticatedUserId: 1 }))
        .rejects.toThrow("Usuário não encontrado.");
    });

    it("should delete user if valid", async () => {
      const mockUser = { id: 2, name: "Target User" };
      usersRepository.findUserById.mockResolvedValue(mockUser);
      usersRepository.deleteUserById.mockResolvedValue(mockUser);

      const result = await usersService.deleteUserService({ userIdToDelete: 2, authenticatedUserId: 1 });

      expect(usersRepository.deleteUserById).toHaveBeenCalledWith(2);
      expect(result.message).toBe("Usuário deletado com sucesso!");
      expect(result.user).toEqual(mockUser);
    });
  });

  describe("deleteOwnUserService", () => {
    it("should throw 400 if userId is not provided", async () => {
      await expect(usersService.deleteOwnUserService(null))
        .rejects.toThrow("ID do usuário não fornecido!");
    });

    it("should throw 404 if user not found", async () => {
      usersRepository.findUserById.mockResolvedValue(null);

      await expect(usersService.deleteOwnUserService(1))
        .rejects.toThrow("Usuário não encontrado!");
    });

    it("should throw 400 if user is ADMIN and is the last admin in system", async () => {
      usersRepository.findUserById.mockResolvedValue({ id: 1, role: "ADMIN" });
      usersRepository.countUsersByRole.mockResolvedValue(1);

      await expect(usersService.deleteOwnUserService(1))
        .rejects.toThrow("Não é possível excluir o último administrador do sistema!!!");
    });

    it("should anonymize logs and delete own user if USER role", async () => {
      const mockUser = { id: 5, role: "USER" };
      usersRepository.findUserById.mockResolvedValue(mockUser);
      apiUsageRepository.anonymizeUsageByUserId.mockResolvedValue({ count: 3 });
      usersRepository.deleteUserById.mockResolvedValue(mockUser);

      const result = await usersService.deleteOwnUserService(5);

      expect(apiUsageRepository.anonymizeUsageByUserId).toHaveBeenCalledWith(5);
      expect(usersRepository.deleteUserById).toHaveBeenCalledWith(5);
      expect(result.message).toBe("Conta excluída com sucesso!");
      expect(result.user).toEqual(mockUser);
    });

    it("should delete own user if ADMIN role and other admins exist", async () => {
      const mockAdmin = { id: 2, role: "ADMIN" };
      usersRepository.findUserById.mockResolvedValue(mockAdmin);
      usersRepository.countUsersByRole.mockResolvedValue(3);
      apiUsageRepository.anonymizeUsageByUserId.mockResolvedValue({ count: 1 });
      usersRepository.deleteUserById.mockResolvedValue(mockAdmin);

      const result = await usersService.deleteOwnUserService(2);

      expect(usersRepository.countUsersByRole).toHaveBeenCalledWith("ADMIN");
      expect(apiUsageRepository.anonymizeUsageByUserId).toHaveBeenCalledWith(2);
      expect(usersRepository.deleteUserById).toHaveBeenCalledWith(2);
      expect(result.message).toBe("Conta excluída com sucesso!");
      expect(result.user).toEqual(mockAdmin);
    });
  });

  describe("changePasswordService", () => {
    const validData = {
      userId: 1,
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
    };

    it("should throw 404 if user not found", async () => {
      usersRepository.findUserByIdWithPassword.mockResolvedValue(null);

      await expect(usersService.changePasswordService(validData))
        .rejects.toThrow("Usuário não encontrado.");
    });

    it("should throw 401 if current password does not match", async () => {
      usersRepository.findUserByIdWithPassword.mockResolvedValue({
        id: 1,
        passwordHash: "storedHash",
      });
      hashProvider.compareHash.mockResolvedValue(false);

      await expect(usersService.changePasswordService(validData))
        .rejects.toThrow("Senha atual incorreta!");
    });

    it("should hash new password and update user when valid", async () => {
      usersRepository.findUserByIdWithPassword.mockResolvedValue({
        id: 1,
        passwordHash: "storedHash",
      });
      hashProvider.compareHash.mockResolvedValue(true);
      hashProvider.generateHash.mockResolvedValue("newHashedPassword");
      const updatedUser = { id: 1, name: "Test User" };
      usersRepository.updateUserPasswordHash.mockResolvedValue(updatedUser);

      const result = await usersService.changePasswordService(validData);

      expect(hashProvider.compareHash).toHaveBeenCalledWith("OldPassword123!", "storedHash");
      expect(hashProvider.generateHash).toHaveBeenCalledWith("NewPassword123!");
      expect(usersRepository.updateUserPasswordHash).toHaveBeenCalledWith({
        id: 1,
        passwordHash: "newHashedPassword",
      });
      expect(result.message).toBe("Senha alterada com sucesso!");
      expect(result.user).toEqual(updatedUser);
    });
  });

  describe("updateProfileService", () => {
    it("should update user profile successfully", async () => {
      const mockUpdated = { id: 1, name: "Novo Nome" };
      usersRepository.updateUser.mockResolvedValue(mockUpdated);

      const result = await usersService.updateProfileService({
        userId: 1,
        name: "Novo Nome",
      });

      expect(usersRepository.updateUser).toHaveBeenCalledWith(1, { name: "Novo Nome" });
      expect(result.message).toBe("Perfil atualizado com sucesso.");
      expect(result.user).toEqual(mockUpdated);
    });

    it("should throw 404 if Prisma P2025 error occurs", async () => {
      const prismaError = new Error("Record not found");
      prismaError.code = "P2025";
      usersRepository.updateUser.mockRejectedValue(prismaError);

      await expect(usersService.updateProfileService({ userId: 999, name: "Novo Nome" }))
        .rejects.toThrow("Usuário não encontrado.");
    });

    it("should rethrow unknown errors", async () => {
      const genericError = new Error("Database timeout");
      usersRepository.updateUser.mockRejectedValue(genericError);

      await expect(usersService.updateProfileService({ userId: 1, name: "Novo Nome" }))
        .rejects.toThrow("Database timeout");
    });
  });

  describe("updatePushTokenService", () => {
    it("should update push token", async () => {
      const mockUser = { id: 1, pushToken: "ExponentPushToken[xyz]" };
      usersRepository.updateUserPushToken.mockResolvedValue(mockUser);

      const result = await usersService.updatePushTokenService({
        userId: 1,
        pushToken: "ExponentPushToken[xyz]",
      });

      expect(usersRepository.updateUserPushToken).toHaveBeenCalledWith(1, "ExponentPushToken[xyz]");
      expect(result.message).toBe("Push token atualizado com sucesso.");
      expect(result.user).toEqual(mockUser);
    });
  });

  describe("Favorites methods", () => {
    it("should list user favorites", async () => {
      const mockFavorites = [{ id: 1, name: "Casa", address: "Rua A" }];
      usersRepository.getUserFavorites.mockResolvedValue(mockFavorites);

      const result = await usersService.listFavoritesService(1);

      expect(usersRepository.getUserFavorites).toHaveBeenCalledWith(1);
      expect(result.favorites).toEqual(mockFavorites);
    });

    it("should add a favorite", async () => {
      const favoriteData = {
        userId: 1,
        name: "Trabalho",
        address: "Av B",
        lat: -19.74,
        lng: -47.93,
      };
      const createdFav = { id: 2, ...favoriteData };
      usersRepository.createUserFavorite.mockResolvedValue(createdFav);

      const result = await usersService.addFavoriteService(favoriteData);

      expect(usersRepository.createUserFavorite).toHaveBeenCalledWith(favoriteData);
      expect(result.message).toBe("Favorito adicionado com sucesso.");
      expect(result.favorite).toEqual(createdFav);
    });

    it("should remove a favorite", async () => {
      usersRepository.deleteUserFavorite.mockResolvedValue({ id: 2 });

      const result = await usersService.removeFavoriteService({ userId: 1, favoriteId: 2 });

      expect(usersRepository.deleteUserFavorite).toHaveBeenCalledWith(2, 1);
      expect(result.message).toBe("Favorito removido com sucesso.");
    });
  });

  describe("Search History methods", () => {
    it("should list user search history", async () => {
      const mockHistory = [{ id: 1, query: "Terminal", address: "Centro" }];
      usersRepository.getUserSearchHistory.mockResolvedValue(mockHistory);

      const result = await usersService.listSearchHistoryService(1);

      expect(usersRepository.getUserSearchHistory).toHaveBeenCalledWith(1);
      expect(result.history).toEqual(mockHistory);
    });

    it("should add search history", async () => {
      const historyData = {
        userId: 1,
        query: "Shopping",
        address: "Av Leopoldino",
        lat: -19.75,
        lng: -47.94,
      };
      const createdHistory = { id: 3, ...historyData };
      usersRepository.createUserSearchHistory.mockResolvedValue(createdHistory);

      const result = await usersService.addSearchHistoryService(historyData);

      expect(usersRepository.createUserSearchHistory).toHaveBeenCalledWith(historyData);
      expect(result.message).toBe("Histórico adicionado com sucesso!");
      expect(result.history).toEqual(createdHistory);
    });

    it("should clear search history", async () => {
      usersRepository.clearUserSearchHistory.mockResolvedValue({ count: 5 });

      const result = await usersService.clearSearchHistoryService(1);

      expect(usersRepository.clearUserSearchHistory).toHaveBeenCalledWith(1);
      expect(result.message).toBe("Histórico limpo com sucesso!");
    });
  });
});
