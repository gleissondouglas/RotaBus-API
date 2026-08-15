/**
 * Decodifica uma string de Polyline do Google em um array de coordenadas.
 * Baseado no algoritmo oficial da Google com proteção contra strings corrompidas.
 */
export function decodePolyline(encoded: string) {
  if (!encoded || typeof encoded !== "string") return [];

  try {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20 && index < len);
      const dlat = (result & 1 ? ~(result >> 1) : result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20 && index < len);
      const dlng = (result & 1 ? ~(result >> 1) : result >> 1);
      lng += dlng;

      const latitude = lat / 1e5;
      const longitude = lng / 1e5;
      if (!isNaN(latitude) && isFinite(latitude) && !isNaN(longitude) && isFinite(longitude)) {
        points.push({ latitude, longitude });
      }
    }
    
    return points;
  } catch {
    return [];
  }
}
