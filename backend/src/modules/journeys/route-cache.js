const redisClient = require("../../config/redis");
const ROUTE_CACHE_TTL_SEC = 2 * 60; // 2 minutos em segundos

async function findCachedRoute(cacheKey) {
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (!cachedData) return null;
    return JSON.parse(cachedData);
  } catch (error) {
    console.error("[RouteCache] Erro ao ler do Redis:", error.message);
    return null; // Fallback graceful
  }
}

async function createRouteCache({ cacheKey, googleResponse, timePreference }) {
  const cachedRoute = {
    googleResponse,
    timePreference,
  };

  try {
    await redisClient.set(
      cacheKey,
      JSON.stringify(cachedRoute),
      "EX",
      ROUTE_CACHE_TTL_SEC
    );
  } catch (error) {
    console.error("[RouteCache] Erro ao salvar no Redis:", error.message);
  }

  return cachedRoute;
}

async function clearRouteCache() {
  // Opcional: Se precisar limpar todo o cache de rotas no Redis
  // Pode ser evitado ou implementado com SCAN/DEL dependendo do padrão de chaves.
}

module.exports = {
  findCachedRoute,
  createRouteCache,
  clearRouteCache,
};
