import { userService } from '../user.service';
import { sessionService } from '../session.service';
import { request } from '../../utils/api';
import { API_BASE_URL } from '../../config/api.config';

jest.mock('../session.service', () => ({
  sessionService: {
    getToken: jest.fn(),
    updateUserSession: jest.fn(),
  },
}));

jest.mock('../../utils/api', () => ({
  request: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('deve chamar a API e atualizar a sessao com o novo perfil', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      const mockResponse = { message: 'ok', user: { id: 1, name: 'Douglas' } };
      (request as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userService.updateProfile('Douglas');

      expect(request).toHaveBeenCalledWith(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ name: 'Douglas' }),
        timeout: 10000,
      });

      expect(sessionService.updateUserSession).toHaveBeenCalledWith(mockResponse.user);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changePassword', () => {
    it('deve alterar a senha corretamente', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (request as jest.Mock).mockResolvedValue({ message: 'ok' });

      await userService.changePassword('old', 'new');

      expect(request).toHaveBeenCalledWith(`${API_BASE_URL}/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ currentPassword: 'old', newPassword: 'new' }),
        timeout: 10000,
      });
    });
  });

  describe('deleteOwnAccount', () => {
    it('deve excluir a conta se autenticado', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (request as jest.Mock).mockResolvedValue({ message: 'deleted' });

      await userService.deleteOwnAccount();

      expect(request).toHaveBeenCalledWith(`${API_BASE_URL}/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${mockToken}` },
        timeout: 10000,
      });
    });

    it('deve falhar se nao autenticado', async () => {
      (sessionService.getToken as jest.Mock).mockResolvedValue(null);
      await expect(userService.deleteOwnAccount()).rejects.toThrow('Usuário não autenticado.');
    });
  });

  describe('updatePushToken', () => {
    it('deve atualizar push token se autenticado', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (request as jest.Mock).mockResolvedValue({ message: 'updated' });

      await userService.updatePushToken('expo-token');

      expect(request).toHaveBeenCalledWith(`${API_BASE_URL}/users/push-token`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ pushToken: 'expo-token' }),
        timeout: 10000,
      });
    });

    it('deve falhar ao atualizar token se nao autenticado', async () => {
      (sessionService.getToken as jest.Mock).mockResolvedValue(null);
      await expect(userService.updatePushToken('t')).rejects.toThrow('Usuário não autenticado.');
    });
  });

  describe('Favorites', () => {
    it('deve retornar vazios se nao autenticado (getFavorites)', async () => {
      (sessionService.getToken as jest.Mock).mockResolvedValue(null);
      const res = await userService.getFavorites();
      expect(res).toEqual([]);
    });

    it('deve retornar favoritos da API (getFavorites)', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (request as jest.Mock).mockResolvedValue([{ id: 1, name: 'Casa' }]);

      const res = await userService.getFavorites();
      expect(res).toEqual([{ id: 1, name: 'Casa' }]);
    });

    it('deve falhar ao adicionar favorito sem token', async () => {
      (sessionService.getToken as jest.Mock).mockResolvedValue(null);
      await expect(userService.addFavorite({ name: 'T', address: 'T', lat: 1, lng: 1 })).rejects.toThrow();
    });

    it('deve adicionar favorito com sucesso', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (request as jest.Mock).mockResolvedValue({ id: 1, name: 'Casa' });

      await userService.addFavorite({ name: 'Casa', address: 'Rua', lat: 0, lng: 0 });
      expect(request).toHaveBeenCalled();
    });

    it('deve falhar ao deletar favorito sem token', async () => {
      (sessionService.getToken as jest.Mock).mockResolvedValue(null);
      await expect(userService.deleteFavorite(1)).rejects.toThrow();
    });

    it('deve deletar favorito com sucesso', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (request as jest.Mock).mockResolvedValue({ message: 'deleted' });

      await userService.deleteFavorite(1);
      expect(request).toHaveBeenCalled();
    });
  });

  describe('History', () => {
    it('deve retornar vazio se nao autenticado (getHistory)', async () => {
      (sessionService.getToken as jest.Mock).mockResolvedValue(null);
      const res = await userService.getHistory();
      expect(res).toEqual([]);
    });

    it('deve retornar historico da API (getHistory)', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (request as jest.Mock).mockResolvedValue([{ id: 1, query: 'A' }]);

      const res = await userService.getHistory();
      expect(res).toEqual([{ id: 1, query: 'A' }]);
    });

    it('deve falhar ao adicionar history sem token', async () => {
      (sessionService.getToken as jest.Mock).mockResolvedValue(null);
      await expect(userService.addHistory({ query: 'A' })).rejects.toThrow();
    });

    it('deve adicionar history com sucesso', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (request as jest.Mock).mockResolvedValue({ id: 1, query: 'A' });

      await userService.addHistory({ query: 'A' });
      expect(request).toHaveBeenCalled();
    });

    it('deve falhar ao limpar history sem token', async () => {
      (sessionService.getToken as jest.Mock).mockResolvedValue(null);
      await expect(userService.clearHistory()).rejects.toThrow();
    });

    it('deve limpar history com sucesso', async () => {
      const mockToken = 'mock-token';
      (sessionService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (request as jest.Mock).mockResolvedValue({ message: 'cleared' });

      await userService.clearHistory();
      expect(request).toHaveBeenCalled();
    });
  });
});
