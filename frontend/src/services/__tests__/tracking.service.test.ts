import { trackingService } from '../tracking.service';
import { API_BASE_URL } from '../../config/api.config';

global.fetch = jest.fn();

describe('trackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pingLocation', () => {
    it('deve enviar ping comunitário e retornar json', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce({ success: true })
      });

      const res = await trackingService.pingLocation('linha-1', -10, -20, 90, 'ida');
      
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/tracking/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineId: 'linha-1', lat: -10, lng: -20, bearing: 90, direction: 'ida' })
      });
      expect(res).toEqual({ success: true });
    });

    it('deve lidar com falha e retornar false', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const res = await trackingService.pingLocation('linha-1', -10, -20);
      expect(res).toBe(false);
    });
  });

  describe('getBusPosition', () => {
    it('deve consultar posicao e retornar dados no sucesso', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ success: true, data: { lat: -10, lng: -20 } })
      });

      const res = await trackingService.getBusPosition('linha-1', 'ida');
      
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/tracking/bus/linha-1?direction=ida`);
      expect(res).toEqual({ lat: -10, lng: -20 });
    });

    it('deve retornar null se response.ok for falso', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      const res = await trackingService.getBusPosition('linha-1');
      expect(res).toBeNull();
    });

    it('deve retornar null se data.success for falso', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ success: false })
      });
      const res = await trackingService.getBusPosition('linha-1');
      expect(res).toBeNull();
    });

    it('deve retornar null em caso de catch network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));
      const res = await trackingService.getBusPosition('linha-1');
      expect(res).toBeNull();
    });
  });
});
