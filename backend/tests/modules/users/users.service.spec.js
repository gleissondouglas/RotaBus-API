const usersService = require("../../../src/modules/users/users.service");
const usersRepository = require("../../../src/modules/users/users.repository");
const hashProvider = require("../../../src/shared/providers/hash.provider");

jest.mock("../../../src/modules/users/users.repository");
jest.mock("../../../src/shared/providers/hash.provider");

describe("Users Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUserService", () => {
    const validData = { name: "Test", email: "test@test.com", password: "password123" };

    it("should throw 409 if email already exists", async () => {
      usersRepository.findUserByEmail.mockResolvedValue({ id: 1, email: "test@test.com" });

      await expect(usersService.createUserService(validData)).rejects.toThrow("Já existe um usuário com esse email.");
    });

    it("should create user and hash password", async () => {
      usersRepository.findUserByEmail.mockResolvedValue(null);
      hashProvider.generateHash.mockResolvedValue("hashedPassword");
      usersRepository.createUser.mockResolvedValue({ id: 1, name: "Test" });

      const result = await usersService.createUserService(validData);

      expect(hashProvider.generateHash).toHaveBeenCalledWith(validData.password);
      expect(usersRepository.createUser).toHaveBeenCalledWith({
        name: validData.name,
        email: validData.email,
        passwordHash: "hashedPassword"
      });
      expect(result.message).toBe("Usuário criado com sucesso!");
      expect(result.user.id).toBe(1);
    });
  });

  describe("listUsersService", () => {
    it("should list all users", async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      usersRepository.findAllUsers.mockResolvedValue(mockUsers);

      const result = await usersService.listUsersService();

      expect(usersRepository.findAllUsers).toHaveBeenCalled();
      expect(result.users).toEqual(mockUsers);
    });
  });

  describe("getProfileService", () => {
    it("should throw 404 if user not found", async () => {
      usersRepository.findUserById.mockResolvedValue(null);

      await expect(usersService.getProfileService(999)).rejects.toThrow("Usuário não encontrado.");
    });

    it("should return profile if user exists", async () => {
      const mockUser = { id: 1, name: "Test" };
      usersRepository.findUserById.mockResolvedValue(mockUser);

      const result = await usersService.getProfileService(1);

      expect(result.user).toEqual(mockUser);
    });
  });

  describe("deleteUserService", () => {
    it("should throw 400 for invalid user ID", async () => {
      await expect(usersService.deleteUserService({ userIdToDelete: "abc", authenticatedUserId: 2 }))
        .rejects.toThrow("ID do usuário inválido!");
    });

    it("should throw 400 if user tries to delete themselves through this route", async () => {
      await expect(usersService.deleteUserService({ userIdToDelete: 1, authenticatedUserId: 1 }))
        .rejects.toThrow("Você não pode deletar sua própria conta de administrador por essa rota!");
    });

    it("should throw 404 if user does not exist", async () => {
      usersRepository.findUserById.mockResolvedValue(null);

      await expect(usersService.deleteUserService({ userIdToDelete: 2, authenticatedUserId: 1 }))
        .rejects.toThrow("Usuário não encontrado.");
    });

    it("should delete user if valid", async () => {
      usersRepository.findUserById.mockResolvedValue({ id: 2 });
      usersRepository.deleteUserById.mockResolvedValue(true);

      const result = await usersService.deleteUserService({ userIdToDelete: 2, authenticatedUserId: 1 });

      expect(usersRepository.deleteUserById).toHaveBeenCalledWith(2);
      expect(result.message).toBe("Usuário deletado com sucesso!");
    });
  });
});
