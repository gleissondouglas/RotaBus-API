const {
  findCachedRoute,
  createRouteCache,
  clearRouteCache,
} = require("../../../src/modules/journeys/route-cache");

jest.mock("../../../src/config/redis", () => {
  const store = new Map();
  return {
    get: jest.fn().mockImplementation(async (key) => store.get(key) || null),
    set: jest.fn().mockImplementation(async (key, value) => {
      store.set(key, value);
    }),
    __store: store,
  };
});

const redisClient = require("../../../src/config/redis");

describe("RouteCache (Redis)", () => {
  beforeEach(() => {
    redisClient.__store.clear();
    jest.clearAllMocks();
  });

  test("deve retornar uma rota armazenada", async () => {
    const cachedRoute = {
      cacheKey: "origem-destino-horario",
      googleResponse: { routes: [{ duration: "600s" }] },
      timePreference: { type: "DEPARTURE", dateTime: "2026-07-11T12:00:00.000Z" },
    };

    await createRouteCache(cachedRoute);
    
    expect(redisClient.set).toHaveBeenCalledWith(
      cachedRoute.cacheKey,
      expect.any(String),
      "EX",
      120
    );

    const result = await findCachedRoute(cachedRoute.cacheKey);
    expect(result).toEqual({
      googleResponse: cachedRoute.googleResponse,
      timePreference: cachedRoute.timePreference,
    });
  });

  test("deve retornar null se a rota não existir no cache", async () => {
    const result = await findCachedRoute("rota-inexistente");
    expect(result).toBeNull();
  });

  test("deve manter rotas diferentes isoladas por chave", async () => {
    await createRouteCache({ cacheKey: "rota-a", googleResponse: { id: "a" } });
    await createRouteCache({ cacheKey: "rota-b", googleResponse: { id: "b" } });

    const routeA = await findCachedRoute("rota-a");
    const routeB = await findCachedRoute("rota-b");

    expect(routeA.googleResponse).toEqual({ id: "a" });
    expect(routeB.googleResponse).toEqual({ id: "b" });
  });

  test("buildRouteCacheKey deve usar prefixo route:live para buscas imediatas e normalizar coordenadas", () => {
    const { buildRouteCacheKey } = require("../../../src/modules/journeys/route-cache");
    const key = buildRouteCacheKey({
      origin: { lat: -19.747231, lng: -47.939284 },
      destination: { text: "Shopping Uberaba" },
      timePreference: { type: "DEPARTURE", dateTime: new Date().toISOString() },
    });

    expect(key).toBe("route:live:-19.747,-47.939:shopping uberaba:DEPARTURE");
  });

  test("buildRouteCacheKey deve usar prefixo route:sched para buscas futuras (> 30 min)", () => {
    const { buildRouteCacheKey } = require("../../../src/modules/journeys/route-cache");
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const key = buildRouteCacheKey({
      origin: { lat: -19.747, lng: -47.939 },
      destination: { text: "Terminal Oeste" },
      timePreference: { type: "DEPARTURE", dateTime: futureDate },
    });

    expect(key).toContain("route:sched:-19.747,-47.939:terminal oeste:DEPARTURE:");
  });

  test("findCachedRoute deve retornar null se o horário limite de saída já passou há mais de 60s", async () => {
    const pastLeaveTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    await createRouteCache({
      cacheKey: "rota-expirada",
      googleResponse: { id: "passada" },
      leaveHomeDateTime: pastLeaveTime,
    });

    const result = await findCachedRoute("rota-expirada");
    expect(result).toBeNull();
  });

  test("findCachedRoute deve retornar rota se o horário de saída ainda estiver no futuro", async () => {
    const futureLeaveTime = new Date(Date.now() + 8 * 60 * 1000).toISOString();
    await createRouteCache({
      cacheKey: "rota-valida",
      googleResponse: { id: "futura" },
      leaveHomeDateTime: futureLeaveTime,
    });

    const result = await findCachedRoute("rota-valida");
    expect(result).not.toBeNull();
    expect(result.googleResponse).toEqual({ id: "futura" });
    expect(result.leaveHomeDateTime).toBe(futureLeaveTime);
  });
});
