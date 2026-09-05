import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { BackButton } from "../components/BackButton";
import { router } from "expo-router";
import * as devLogger from "../utils/devLogger";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock("../utils/devLogger", () => ({
  logUserInteraction: jest.fn(),
}));

describe("BackButton", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("chama router.back() e logUserInteraction por padrão ao ser clicado", () => {
    const { getByText } = render(<BackButton label="Voltar" />);

    const button = getByText("Voltar");
    fireEvent.press(button);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(devLogger.logUserInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        component: "<BackButton />",
        label: "Voltar",
        action: "Retornou à tela anterior (router.back)",
      })
    );
  });

  it("chama onPress customizado se fornecido", () => {
    const customPress = jest.fn();
    const { getByText } = render(<BackButton label="Voltar" onPress={customPress} />);

    const button = getByText("Voltar");
    fireEvent.press(button);

    expect(customPress).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
    expect(devLogger.logUserInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        component: "<BackButton />",
        action: "Disparou onPress customizado",
      })
    );
  });
});
