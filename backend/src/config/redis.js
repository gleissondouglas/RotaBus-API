const Redis = require("ioredis");

// Conexão com o Redis (Local ou Render / Upstash)
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const isUpstash = redisUrl.includes('upstash.io');
const isTest = process.env.NODE_ENV === 'test';

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: isTest ? 0 : 3,
  family: 0,
  lazyConnect: isTest,
  enableOfflineQueue: !isTest,
  ...(isUpstash || redisUrl.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}),
  retryStrategy(times) {
    if (isTest) return null;
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

if (!isTest) {
  redisClient.on("connect", () => {
    console.log("[Redis] 🟢 Conectado com sucesso ao servidor Redis.");
  });

  redisClient.on("error", (error) => {
    console.error("[Redis] 🔴 Erro de conexão:", error.message);
  });
}

module.exports = redisClient;
