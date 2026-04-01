/**
 * Haversine — distanza in metri tra due coordinate GPS.
 * Riutilizzabile lato client e server.
 */
export function calcolaDistanza(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000; // raggio Terra in metri
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface Sede {
  nome: string;
  lat: number;
  lng: number;
  raggio: number; // metri
}

export const SEDI: Sede[] = [
  { nome: "La Casa dei Gelsi",       lat: 45.698997, lng: 11.770444, raggio: 100 },
  { nome: "Tenuta Villa Peggy's",    lat: 45.672833, lng: 11.732111, raggio: 100 },
  { nome: "Studios Club / TooLate",  lat: 45.775361, lng: 11.689500, raggio: 100 },
];

export interface RisultatoGeo {
  inSede: boolean;
  sede: Sede | null;
  distanza: number;     // distanza dalla sede più vicina
  sedeVicina: Sede;     // sede più vicina (sempre presente)
}

/**
 * Dato un punto GPS determina se è dentro una delle sedi.
 * Restituisce sempre la sede più vicina con la distanza.
 */
export function verificaSede(lat: number, lng: number): RisultatoGeo {
  let minDist = Infinity;
  let closest: Sede = SEDI[0];
  let matchSede: Sede | null = null;

  for (const sede of SEDI) {
    const d = calcolaDistanza(lat, lng, sede.lat, sede.lng);
    if (d < minDist) {
      minDist = d;
      closest = sede;
    }
    if (d <= sede.raggio && !matchSede) {
      matchSede = sede;
    }
  }

  return {
    inSede: matchSede !== null,
    sede: matchSede,
    distanza: Math.round(minDist),
    sedeVicina: closest,
  };
}
