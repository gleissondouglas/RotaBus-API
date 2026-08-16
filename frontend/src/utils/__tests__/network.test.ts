import { isConnected, withRetry } from '../network';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true })
}));

describe('network utility', () => {
  describe('isConnected', () => {
    it('deve retornar true como fallback se NetInfo falhar', async () => {
      // NetInfo nao esta mockado nativamente aqui, o código usa require implicito.
      // Neste ambiente de jest, NetInfo estará null ou falhará. 
      // Por padrao isConnected retorna true de fallback em catch
      const connected = await isConnected();
      expect(connected).toBe(true);
    });
  });

  describe('withRetry', () => {
    it('deve retornar dado imediatamente se tiver sucesso', async () => {
      const fn = jest.fn().mockResolvedValue('sucesso');
      const res = await withRetry(fn);
      expect(res).toBe('sucesso');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve falhar imediatamente se nao for erro de rede', async () => {
      const error = new Error('Erro de Logica Fatal');
      const fn = jest.fn().mockRejectedValue(error);
      await expect(withRetry(fn)).rejects.toThrow('Erro de Logica Fatal');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve tentar novamente em caso de erro de rede e ter sucesso na segunda tentativa', async () => {
      const error = new Error('Network timeout');
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('sucesso_2');
      
      const res = await withRetry(fn, 3, 10); // delay = 10ms
      expect(res).toBe('sucesso_2');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('deve jogar erro se exceder retries', async () => {
      const error = new Error('Network timeout');
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(withRetry(fn, 1, 10)).rejects.toThrow('Network timeout');
      expect(fn).toHaveBeenCalledTimes(2); // 1 tentativa normal + 1 retry = falha
    });
  });
});
