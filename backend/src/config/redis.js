const Redis = require("ioredis");
const { env } = require("./env"); // Assumindo que você tenha um validador de env

// Conexão com o Redis (Local ou Nuvem)
// Em produção (Heroku, AWS), você usaria a variável REDIS_URL
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const isUpstash = redisUrl.includes('upstash.io');

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  family: 0,
  ...(isUpstash || redisUrl.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}),
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on("connect", () => {
  console.log("[Redis] 🟢 Conectado com sucesso ao servidor Redis.");
});

redisClient.on("error", (error) => {
  console.error("[Redis] 🔴 Erro de conexão:", error.message);
});

module.exports = redisClient;
