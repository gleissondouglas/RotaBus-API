import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  AccessibilityProvider,
  useAccessibility,
} from "../AccessibilityContext";
import { STORAGE_KEYS } from "../../constants/storage";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe("AccessibilityContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AccessibilityProvider>{children}</AccessibilityProvider>
  );

  it("should initialize with default settings when nothing is in storage", async () => {
    const { result } = renderHook(() => useAccessibility(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.largeText).toBe(false);
    expect(result.current.slowVoice).toBe(true);
    expect(result.current.highContrast).toBe(false);
    expect(result.current.autoRead).toBe(true);
    expect(result.current.vibration).toBe(true);
  });

  it("should load persisted settings from SecureStore on native", async () => {
    const savedSettings = {
      largeText: true,
      slowVoice: false,
      highContrast: true,
      autoRead: false,
      vibration: false,
    };
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(savedSettings)
    );

    const { result } = renderHook(() => useAccessibility(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.largeText).toBe(true);
    expect(result.current.slowVoice).toBe(false);
    expect(result.current.highContrast).toBe(true);
    expect(result.current.autoRead).toBe(false);
    expect(result.current.vibration).toBe(false);
  });

  it("should handle storage read error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
      new Error("Storage unavailable")
    );

    const { result } = renderHook(() => useAccessibility(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.largeText).toBe(false); // Keeps default
    consoleSpy.mockRestore();
  });

  it("should update settings and persist to SecureStore", async () => {
    const { result } = renderHook(() => useAccessibility(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ largeText: true, highContrast: true });
    });

    expect(result.current.largeText).toBe(true);
    expect(result.current.highContrast).toBe(true);
    expect(result.current.slowVoice).toBe(true); // preserved

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESSIBILITY_SETTINGS,
      expect.stringContaining('"largeText":true')
    );
  });

  it("should handle storage write error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
      new Error("Write error")
    );

    const { result } = renderHook(() => useAccessibility(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ vibration: false });
    });

    expect(result.current.vibration).toBe(false);
    consoleSpy.mockRestore();
  });

  it("should throw error if useAccessibility is used outside of AccessibilityProvider", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAccessibility())).toThrow(
      "useAccessibility must be used within an AccessibilityProvider"
    );
    consoleErrorSpy.mockRestore();
  });

  it("should use localStorage on web platform", async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true });

    const mockStorage: Record<string, string> = {
      [STORAGE_KEYS.ACCESSIBILITY_SETTINGS]: JSON.stringify({
        largeText: true,
        slowVoice: true,
        highContrast: false,
        autoRead: true,
        vibration: true,
      }),
    };

    const originalLocalStorage = global.localStorage;
    (global as any).localStorage = {
      getItem: jest.fn((key: string) => mockStorage[key] || null),
      setItem: jest.fn((key: string, val: string) => {
        mockStorage[key] = val;
      }),
    };

    const { result } = renderHook(() => useAccessibility(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.largeText).toBe(true);

    await act(async () => {
      await result.current.updateSettings({ highContrast: true });
    });

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESSIBILITY_SETTINGS,
      expect.stringContaining('"highContrast":true')
    );

    (global as any).localStorage = originalLocalStorage;
    Object.defineProperty(Platform, "OS", { value: originalPlatform, configurable: true });
  });
});
