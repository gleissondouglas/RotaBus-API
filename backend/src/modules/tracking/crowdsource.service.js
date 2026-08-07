const redisClient = require('../../config/redis');

const REDIS_KEY_PREFIX = 'bus_position:';

/**
 * Registra a posição de um passageiro que clicou em "Embarquei no ônibus".
 * Os dados do celular dele (anônimos) se tornam o GPS comunitário do ônibus.
 */
async function recordPassengerLocation({ lineId, lat, lng, speed, bearing }) {
  try {
    if (!lineId || !lat || !lng) return false;

    // Remove espaços/caracteres indesejados da linha (ex: "305 - Centro" -> "305-Centro")
    const cleanLineId = String(lineId).trim().replace(/\s+/g, '-');
    
    const positionData = {
      lat,
      lng,
      speed: speed || 0,
      bearing: bearing || null,
      timestamp: Math.floor(Date.now() / 1000),
      source: 'crowdsourcing' // Indica que veio da comunidade
    };

    // Salva a localização da linha no Redis
    // Usa um TTL (expiração) de 120 segundos. 
    // Se nenhum passageiro enviar GPS por 2 min, o ônibus some do mapa em tempo real.
    await redisClient.set(
      `${REDIS_KEY_PREFIX}${cleanLineId}`, 
      JSON.stringify(positionData), 
      'EX', 
      120 
    );

    return true;
  } catch (error) {
    console.error('[CROWDSOURCING] Erro ao gravar posição:', error.message);
    return false;
  }
}

/**
 * Consulta a última posição comunitária do ônibus
 */
async function getBusPosition(lineId) {
  const cleanLineId = String(lineId).trim().replace(/\s+/g, '-');
  const data = await redisClient.get(`${REDIS_KEY_PREFIX}${cleanLineId}`);
  if (!data) return null; // Sem passageiros compartilhando ou GPS expirou
  return JSON.parse(data);
}

module.exports = {
  recordPassengerLocation,
  getBusPosition
};
