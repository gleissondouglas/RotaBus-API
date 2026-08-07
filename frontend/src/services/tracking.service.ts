import { API_BASE_URL } from "../config/api.config";

/**
 * Serviço responsável por enviar a localização do passageiro para alimentar o sistema comunitário,
 * e também por consultar a posição dos ônibus.
 */
export const trackingService = {
  async pingLocation(lineId: string, lat: number, lng: number, heading?: number | null) {
    try {
      const response = await fetch(`${API_BASE_URL}/tracking/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId, lat, lng, bearing: heading })
      });
      return await response.json();
    } catch (e) {
      console.warn("[Tracking] Falha ao enviar ping comunitário", e);
      return false;
    }
  },
  
  async getBusPosition(lineId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/tracking/bus/${encodeURIComponent(lineId)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (e) {
      return null;
    }
  }
};
