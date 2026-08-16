import { cache } from '../cache';
import { appStorage } from '../../services/storage.service';

jest.mock('../../services/storage.service', () => ({
  appStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    deleteItem: jest.fn(),
  }
}));

describe('cache utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve salvar item no cache offline com timestamp e key tratada', async () => {
    await cache.set('my-key!!!', { a: 1 });
    expect(appStorage.setItem).toHaveBeenCalledWith(
      'offline_cache_my-key___',
      JSON.stringify({ data: { a: 1 }, timestamp: 1000000 })
    );
  });

  it('deve retornar null se item nao existir no storage', async () => {
    (appStorage.getItem as jest.Mock).mockResolvedValue(null);
    const data = await cache.get('my-key', 5000);
    expect(data).toBeNull();
  });

  it('deve retornar dados se cache for valido (dentro do ttl)', async () => {
    (appStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ data: { a: 1 }, timestamp: 999000 })
    );
    // age = 1000, ttl = 5000 -> valid
    const data = await cache.get('my-key', 5000);
    expect(data).toEqual({ a: 1 });
  });

  it('deve deletar do storage e retornar null se cache estiver expirado', async () => {
    (appStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ data: { a: 1 }, timestamp: 990000 })
    );
    // age = 10000, ttl = 5000 -> expired
    const data = await cache.get('my-key', 5000);
    expect(appStorage.deleteItem).toHaveBeenCalledWith('offline_cache_my-key');
    expect(data).toBeNull();
  });

  it('deve tratar excecao de json parse retornando null', async () => {
    (appStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');
    const data = await cache.get('my-key', 5000);
    expect(data).toBeNull();
  });

  it('deve engolir silenciosamente o clear (noop)', async () => {
    await expect(cache.clear()).resolves.not.toThrow();
  });
});
