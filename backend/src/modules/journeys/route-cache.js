const redisClient = require("../../config/redis");

/**
 * Constrói uma chave única e inteligente para o cache de rotas.
 * 
 * - Coordenadas de origem arredondadas para 3 casas decimais (~100m)
 * - Destino normalizado
 * - Se a busca for para agora (diferença menor que 30 min da hora atual), usa prefixo "live"
 * - Se for agendada para o futuro (> 30 min), inclui data/hora arredondada em 5 min
 */
function buildRouteCacheKey({ origin, destination, timePreference }) {
  const latRounded = Number(origin?.lat || 0).toFixed(3);
  const lngRounded = Number(origin?.lng || 0).toFixed(3);
  const destText = String(destination?.text || destination?.address || destination || "")
    .toLowerCase()
    .trim();
  const type = timePreference?.type || "DEPARTURE";

  const targetDate = timePreference?.dateTime ? new Date(timePreference.dateTime) : new Date();
  const now = new Date();
  const diffMs = Math.abs(targetDate.getTime() - now.getTime());
  const isImmediate = Number.isNaN(diffMs) || diffMs < 30 * 60 * 1000;

  if (isImmediate) {
    return `route:live:${latRounded},${lngRounded}:${destText}:${type}`;
  }

  // Agendada para o futuro (> 30 min): arredonda em blocos de 5 minutos
  const roundedTime = new Date(Math.round(targetDate.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000));
  const timeKey = roundedTime.toISOString().slice(0, 16);
  return `route:sched:${latRounded},${lngRounded}:${destText}:${type}:${timeKey}`;
}

async function findCachedRoute(cacheKey) {
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (!cachedData) return null;

    const parsed = JSON.parse(cachedData);

    // Se tiver leaveHomeDateTime definido e a hora de sair já passou há mais de 1 minuto:
    if (parsed.leaveHomeDateTime) {
      const leaveHomeMs = new Date(parsed.leaveHomeDateTime).getTime();
      // Se agora passou do horário limite de saída (+60s de tolerância), usuário perderia o ônibus!
      if (Date.now() > leaveHomeMs + 60 * 1000) {
        return null;
      }
    }

    return parsed;
  } catch (error) {
    console.error("[RouteCache] Erro ao ler do Redis:", error.message);
    return null; // Fallback graceful
  }
}

async function createRouteCache({
  cacheKey,
  googleResponse,
  timePreference,
  leaveHomeDateTime,
}) {
  const cachedRoute = {
    googleResponse,
    timePreference,
  };

  if (leaveHomeDateTime) {
    cachedRoute.leaveHomeDateTime = leaveHomeDateTime;
    cachedRoute.cachedAt = new Date().toISOString();
  }

  try {
    let ttlSeconds = 120; // fallback padrão de 120s (2 min)

    if (leaveHomeDateTime) {
      const leaveHomeMs = new Date(leaveHomeDateTime).getTime();
      const diffSec = Math.floor((leaveHomeMs - Date.now()) / 1000);
      if (diffSec > 0) {
        // Armazena até o horário de sair + 2 minutos de margem
        ttlSeconds = Math.min(Math.max(diffSec + 120, 120), 3600); // no máximo 1 hora
      }
    }

    await redisClient.set(
      cacheKey,
      JSON.stringify(cachedRoute),
      "EX",
      ttlSeconds
    );
  } catch (error) {
    console.error("[RouteCache] Erro ao salvar no Redis:", error.message);
  }

  return cachedRoute;
}

async function clearRouteCache() {
  // Opcional: Se precisar limpar todo o cache de rotas no Redis
}

module.exports = {
  buildRouteCacheKey,
  findCachedRoute,
  createRouteCache,
  clearRouteCache,
};
