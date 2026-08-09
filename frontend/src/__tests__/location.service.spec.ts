import * as Location from "expo-location";
import { locationService } from "../services/location.service";

// Mock do expo-location
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  Accuracy: {
    High: 6,
  },
}));

describe("locationService", () => {
  const originalDev = (global as any).__DEV__;
  afterEach(() => {
    (global as any).__DEV__ = originalDev;
    jest.clearAllMocks();
  });



  describe("requestLocationPermission", () => {
    it("deve retornar true quando a permissão for concedida", async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "granted",
      });

      const result = await locationService.requestLocationPermission();
      expect(result).toBe(true);
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it("deve retornar false quando a permissão for negada", async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "denied",
      });

      const result = await locationService.requestLocationPermission();
      expect(result).toBe(false);
    });
  });

  describe("getCurrentLocation", () => {
    it("deve retornar latitude e longitude com sucesso", async () => {
      const mockLocation = {
        coords: {
          latitude: -19.0,
          longitude: -47.0,
        },
      };

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce(mockLocation);

      const result = await locationService.getCurrentLocation();
      
      expect(result).toEqual({
        latitude: -19.0,
        longitude: -47.0,
      });
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.High,
      });
    });

    it("deve lançar erro em produção ou usar fallback em dev quando der erro", async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(new Error("GPS failed"));

      // Em ambiente de teste do jest, __DEV__ costuma ser true por padrão no react-native.
      // Se for false, ele lançará erro. Como estamos mockando o comportamento, testamos o fallback.
      const prevDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      const result = await locationService.getCurrentLocation();
      expect(result).toEqual({
        latitude: -19.7472,
        longitude: -47.9392,
      });

      (global as any).__DEV__ = prevDev;
    });
  });

  describe("geocodeAddress", () => {
    it("deve retornar a primeira coordenada se encontrar o endereço", async () => {
      (Location.geocodeAsync as jest.Mock).mockResolvedValueOnce([
        { latitude: -19.5, longitude: -48.0 },
        { latitude: -20.0, longitude: -49.0 },
      ]);

      const result = await locationService.geocodeAddress("Rua Teste, 123");
      expect(result).toEqual({
        latitude: -19.5,
        longitude: -48.0,
      });
      expect(Location.geocodeAsync).toHaveBeenCalledWith("Rua Teste, 123");
    });

    it("deve retornar null se não encontrar o endereço", async () => {
      (Location.geocodeAsync as jest.Mock).mockResolvedValueOnce([]);

      const result = await locationService.geocodeAddress("Endereco Invalido");
      expect(result).toBeNull();
    });

    it("deve retornar null se a geocodificação lançar erro", async () => {
      (Location.geocodeAsync as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await locationService.geocodeAddress("Erro de rede");
      expect(result).toBeNull();
    });
  });
});
