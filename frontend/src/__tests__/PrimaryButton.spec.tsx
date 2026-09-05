import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import * as devLogger from "../utils/devLogger";

jest.mock("../utils/devLogger", () => ({
  logUserInteraction: jest.fn(),
}));

describe("PrimaryButton", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza o título corretamente e responde ao toque emitindo log de interação", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <PrimaryButton
        title="Buscar Rota"
        onPress={onPressMock}
        fileOrScreen="app/inicio.tsx"
        actionDescription="Iniciar busca de rota"
      />
    );

    const button = getByText("Buscar Rota");
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
    expect(devLogger.logUserInteraction).toHaveBeenCalledWith({
      component: "<PrimaryButton />",
      label: "Buscar Rota",
      fileOrScreen: "app/inicio.tsx",
      action: "Iniciar busca de rota",
    });
  });

  it("não dispara onPress nem emite log quando desabilitado", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <PrimaryButton
        title="Confirmar"
        onPress={onPressMock}
        disabled={true}
      />
    );

    const button = getByText("Confirmar");
    fireEvent.press(button);

    expect(onPressMock).not.toHaveBeenCalled();
    expect(devLogger.logUserInteraction).not.toHaveBeenCalled();
  });
});
