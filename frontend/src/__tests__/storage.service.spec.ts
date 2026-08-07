import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { appStorage } from "../services/storage.service";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("appStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Native Platform (iOS/Android)", () => {
    beforeAll(() => {
      Platform.OS = "ios"; // Simulando mobile
    });

    it("deve usar SecureStore para setItem", async () => {
      await appStorage.setItem("token", "123");
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("token", "123");
    });

    it("deve usar SecureStore para getItem", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce("123");
      const value = await appStorage.getItem("token");
      expect(value).toBe("123");
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith("token");
    });

    it("deve usar SecureStore para deleteItem", async () => {
      await appStorage.deleteItem("token");
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("token");
    });
  });

  describe("Web Platform", () => {
    const mockLocalStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    };

    beforeAll(() => {
      Platform.OS = "web";
      Object.defineProperty(global, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });
    });

    afterAll(() => {
      Platform.OS = "ios";
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("deve usar localStorage para setItem na web", async () => {
      await appStorage.setItem("token", "123");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("token", "123");
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it("deve usar localStorage para getItem na web", async () => {
      mockLocalStorage.getItem.mockReturnValueOnce("123");
      const value = await appStorage.getItem("token");
      expect(value).toBe("123");
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("token");
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });

    it("deve usar localStorage para deleteItem na web", async () => {
      await appStorage.deleteItem("token");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });
  });
});
