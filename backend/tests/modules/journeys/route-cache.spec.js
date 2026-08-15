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
});
