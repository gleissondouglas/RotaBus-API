import { logUserInteraction } from "../utils/devLogger";

describe("devLogger", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("emite log formatado no terminal quando em desenvolvimento (__DEV__ === true)", () => {
    logUserInteraction({
      component: "<PrimaryButton />",
      label: "Entrar ou criar conta",
      fileOrScreen: "app/index.tsx",
      action: "Navegar para /login",
      details: { route: "/login" },
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      '[RotaBus:Interação] 🔘 Elemento: <PrimaryButton /> | Texto: "Entrar ou criar conta" | Arquivo: app/index.tsx | Ação: Navegar para /login | Detalhes: {"route":"/login"}'
    );
  });

  it("omite arquivo e detalhes quando não são informados", () => {
    logUserInteraction({
      component: "<BackButton />",
      label: "Voltar",
      action: "Retornar à tela anterior",
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      '[RotaBus:Interação] 🔘 Elemento: <BackButton /> | Texto: "Voltar" | Ação: Retornar à tela anterior'
    );
  });

  it("não emite logs se __DEV__ for false", () => {
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = false;

    try {
      logUserInteraction({
        component: "<PrimaryButton />",
        label: "Entrar",
        action: "Login",
      });

      expect(logSpy).not.toHaveBeenCalled();
    } finally {
      (global as any).__DEV__ = originalDev;
    }
  });
});
