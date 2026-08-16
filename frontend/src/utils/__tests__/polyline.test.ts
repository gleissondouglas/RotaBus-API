import { decodePolyline } from '../polyline';

describe('polyline utility', () => {
  it('deve retornar array vazio se a string for nula ou invalida', () => {
    expect(decodePolyline('')).toEqual([]);
    expect(decodePolyline(null as any)).toEqual([]);
    expect(decodePolyline(undefined as any)).toEqual([]);
    expect(decodePolyline(123 as any)).toEqual([]);
  });

  it('deve decodificar uma polyline simples corretamente', () => {
    // Uma polyline simples oficial (exemplo do Google: 38.5, -120.2)
    const simple = '_p~iF~ps|U';
    const decoded = decodePolyline(simple);
    expect(decoded.length).toBe(1);
    expect(decoded[0].latitude).toBeCloseTo(38.5, 4);
    expect(decoded[0].longitude).toBeCloseTo(-120.2, 4);
  });

  it('deve decodificar multiplas coordenadas', () => {
    // Polyline de 3 pontos do manual do Google: 
    // (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const threePoints = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const decoded = decodePolyline(threePoints);
    expect(decoded.length).toBe(3);
    expect(decoded[0].latitude).toBeCloseTo(38.5, 4);
    expect(decoded[0].longitude).toBeCloseTo(-120.2, 4);
    expect(decoded[1].latitude).toBeCloseTo(40.7, 4);
    expect(decoded[1].longitude).toBeCloseTo(-120.95, 4);
    expect(decoded[2].latitude).toBeCloseTo(43.252, 4);
    expect(decoded[2].longitude).toBeCloseTo(-126.453, 4);
  });

  it('deve retornar vazio se a decodificacao falhar com throw', () => {
    // Simula erro de tipagem profunda forçando o código a falhar
    const decoded = decodePolyline({ length: 'nao-numero' } as any);
    expect(decoded).toEqual([]);
  });
});
