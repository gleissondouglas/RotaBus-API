const crowdsourceService = require('../../../src/modules/tracking/crowdsource.service');
const redisClient = require('../../../src/config/redis');

jest.mock('../../../src/config/redis', () => {
  const store = new Map();
  return {
    set: jest.fn(async (key, val) => store.set(key, val)),
    get: jest.fn(async (key) => store.get(key) || null),
    store,
  };
});

describe('Crowdsource Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.store.clear();
  });

  it('deve registrar localização da linha geral e com direção', async () => {
    const success = await crowdsourceService.recordPassengerLocation({
      lineId: '100 - Centro',
      direction: 'Terminal Leste',
      lat: -19.745,
      lng: -47.931,
      speed: 25,
      bearing: 90,
    });

    expect(success).toBe(true);
    expect(redisClient.set).toHaveBeenCalledTimes(2);

    // 1. Chave geral da linha
    const busGeneral = await crowdsourceService.getBusPosition('100 - Centro');
    expect(busGeneral).not.toBeNull();
    expect(busGeneral.lat).toBe(-19.745);
    expect(busGeneral.direction).toBe('Terminal Leste');

    // 2. Chave específica com direção
    const busWithDirection = await crowdsourceService.getBusPosition('100 - Centro', 'Terminal Leste');
    expect(busWithDirection).not.toBeNull();
    expect(busWithDirection.lat).toBe(-19.745);
  });

  it('deve retornar null quando a linha não tiver dados', async () => {
    const bus = await crowdsourceService.getBusPosition('999');
    expect(bus).toBeNull();
  });

  it('deve rejeitar se lineId ou coordenadas estiverem faltando', async () => {
    const result = await crowdsourceService.recordPassengerLocation({
      lineId: '',
      lat: -19.745,
      lng: -47.931,
    });
    expect(result).toBe(false);
  });
});
