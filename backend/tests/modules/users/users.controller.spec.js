const usersController = require("../../../src/modules/users/users.controller");
const usersService = require("../../../src/modules/users/users.service");

jest.mock("../../../src/modules/users/users.service");

describe("Users Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 1 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create user and return 201", async () => {
      req.body = { name: "Test User", email: "test@test.com", password: "Password123!" };
      const mockResult = { message: "Usuário criado com sucesso!", user: { id: 1 } };
      usersService.createUserService.mockResolvedValue(mockResult);

      await usersController.createUser(req, res, next);

      expect(usersService.createUserService).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Validation error");
      usersService.createUserService.mockRejectedValue(error);

      await usersController.createUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("listUsers", () => {
    it("should list users and return 200", async () => {
      const mockResult = { message: "Usuários encontrados com sucesso!", users: [] };
      usersService.listUsersService.mockResolvedValue(mockResult);

      await usersController.listUsers(req, res, next);

      expect(usersService.listUsersService).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Database error");
      usersService.listUsersService.mockRejectedValue(error);

      await usersController.listUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getProfile", () => {
    it("should return user profile and return 200", async () => {
      const mockResult = { message: "Perfil encontrado com sucesso!", user: { id: 1 } };
      usersService.getProfileService.mockResolvedValue(mockResult);

      await usersController.getProfile(req, res, next);

      expect(usersService.getProfileService).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("User not found");
      usersService.getProfileService.mockRejectedValue(error);

      await usersController.getProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateProfile", () => {
    it("should update user profile and return 200", async () => {
      req.body = { name: "Novo Nome" };
      const mockResult = { message: "Perfil atualizado com sucesso.", user: { id: 1, name: "Novo Nome" } };
      usersService.updateProfileService.mockResolvedValue(mockResult);

      await usersController.updateProfile(req, res, next);

      expect(usersService.updateProfileService).toHaveBeenCalledWith({
        userId: 1,
        name: "Novo Nome",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Validation error");
      usersService.updateProfileService.mockRejectedValue(error);

      await usersController.updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteUser", () => {
    it("should delete user and return 200", async () => {
      req.params = { id: "2" };
      const mockResult = { message: "Usuário deletado com sucesso!", user: { id: 2 } };
      usersService.deleteUserService.mockResolvedValue(mockResult);

      await usersController.deleteUser(req, res, next);

      expect(usersService.deleteUserService).toHaveBeenCalledWith({
        userIdToDelete: "2",
        authenticatedUserId: 1,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Delete error");
      usersService.deleteUserService.mockRejectedValue(error);

      await usersController.deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteMe", () => {
    it("should delete own user account and return 200", async () => {
      const mockResult = { message: "Conta excluída com sucesso!", user: { id: 1 } };
      usersService.deleteOwnUserService.mockResolvedValue(mockResult);

      await usersController.deleteMe(req, res, next);

      expect(usersService.deleteOwnUserService).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Cannot delete last admin");
      usersService.deleteOwnUserService.mockRejectedValue(error);

      await usersController.deleteMe(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("changePassword", () => {
    it("should change user password and return 200", async () => {
      req.body = { currentPassword: "OldPassword123!", newPassword: "NewPassword123!" };
      const mockResult = { message: "Senha alterada com sucesso!", user: { id: 1 } };
      usersService.changePasswordService.mockResolvedValue(mockResult);

      await usersController.changePassword(req, res, next);

      expect(usersService.changePasswordService).toHaveBeenCalledWith({
        userId: 1,
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Password mismatch");
      usersService.changePasswordService.mockRejectedValue(error);

      await usersController.changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updatePushToken", () => {
    it("should update push token and return 200", async () => {
      req.body = { pushToken: "ExponentPushToken[xyz]" };
      const mockResult = { message: "Push token atualizado com sucesso.", user: { id: 1 } };
      usersService.updatePushTokenService.mockResolvedValue(mockResult);

      await usersController.updatePushToken(req, res, next);

      expect(usersService.updatePushTokenService).toHaveBeenCalledWith({
        userId: 1,
        pushToken: "ExponentPushToken[xyz]",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Push token error");
      usersService.updatePushTokenService.mockRejectedValue(error);

      await usersController.updatePushToken(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("listFavorites", () => {
    it("should list user favorites and return 200", async () => {
      const mockResult = { favorites: [{ id: 1, name: "Casa" }] };
      usersService.listFavoritesService.mockResolvedValue(mockResult);

      await usersController.listFavorites(req, res, next);

      expect(usersService.listFavoritesService).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Favorites error");
      usersService.listFavoritesService.mockRejectedValue(error);

      await usersController.listFavorites(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("addFavorite", () => {
    it("should add favorite and return 201", async () => {
      req.body = { name: "Casa", address: "Rua A", lat: -19.74, lng: -47.93 };
      const mockResult = { message: "Favorito adicionado com sucesso.", favorite: { id: 1 } };
      usersService.addFavoriteService.mockResolvedValue(mockResult);

      await usersController.addFavorite(req, res, next);

      expect(usersService.addFavoriteService).toHaveBeenCalledWith({
        userId: 1,
        name: "Casa",
        address: "Rua A",
        lat: -19.74,
        lng: -47.93,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Add favorite error");
      usersService.addFavoriteService.mockRejectedValue(error);

      await usersController.addFavorite(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("removeFavorite", () => {
    it("should remove favorite and return 200", async () => {
      req.params = { id: "2" };
      const mockResult = { message: "Favorito removido com sucesso." };
      usersService.removeFavoriteService.mockResolvedValue(mockResult);

      await usersController.removeFavorite(req, res, next);

      expect(usersService.removeFavoriteService).toHaveBeenCalledWith({
        userId: 1,
        favoriteId: 2,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Remove favorite error");
      usersService.removeFavoriteService.mockRejectedValue(error);

      await usersController.removeFavorite(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("listSearchHistory", () => {
    it("should list search history and return 200", async () => {
      const mockResult = { history: [{ id: 1, query: "Terminal" }] };
      usersService.listSearchHistoryService.mockResolvedValue(mockResult);

      await usersController.listSearchHistory(req, res, next);

      expect(usersService.listSearchHistoryService).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("History error");
      usersService.listSearchHistoryService.mockRejectedValue(error);

      await usersController.listSearchHistory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("addSearchHistory", () => {
    it("should add search history and return 201", async () => {
      req.body = { query: "Shopping", address: "Av Leopoldino", lat: -19.75, lng: -47.94 };
      const mockResult = { message: "Histórico adicionado com sucesso!", history: { id: 1 } };
      usersService.addSearchHistoryService.mockResolvedValue(mockResult);

      await usersController.addSearchHistory(req, res, next);

      expect(usersService.addSearchHistoryService).toHaveBeenCalledWith({
        userId: 1,
        query: "Shopping",
        address: "Av Leopoldino",
        lat: -19.75,
        lng: -47.94,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Add history error");
      usersService.addSearchHistoryService.mockRejectedValue(error);

      await usersController.addSearchHistory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("clearSearchHistory", () => {
    it("should clear search history and return 200", async () => {
      const mockResult = { message: "Histórico limpo com sucesso!" };
      usersService.clearSearchHistoryService.mockResolvedValue(mockResult);

      await usersController.clearSearchHistory(req, res, next);

      expect(usersService.clearSearchHistoryService).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Clear history error");
      usersService.clearSearchHistoryService.mockRejectedValue(error);

      await usersController.clearSearchHistory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
