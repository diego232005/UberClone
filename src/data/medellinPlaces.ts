import type { LatLng, VehicleCategory } from '../types';

/** Puntos reales de Medellín para solicitudes demo siempre distintas. */
export const MEDELLIN_PLACES: LatLng[] = [
  { lat: 6.2088, lng: -75.567, address: 'El Poblado — Parque Lleras, Medellín' },
  { lat: 6.2442, lng: -75.5812, address: 'Centro — Parque Berrío, Medellín' },
  { lat: 6.2674, lng: -75.5685, address: 'Universidad de Antioquia, Medellín' },
  { lat: 6.2308, lng: -75.5906, address: 'Laureles — Primer Parque, Medellín' },
  { lat: 6.1989, lng: -75.575, address: 'Envigado — Mayorca, cerca Medellín' },
  { lat: 6.2518, lng: -75.5636, address: 'Manrique — Parque Principal, Medellín' },
  { lat: 6.175, lng: -75.5918, address: 'Sabaneta — Parque, cerca Medellín' },
  { lat: 6.273, lng: -75.5905, address: 'Robledo — Universidad Nacional, Medellín' },
  { lat: 6.217, lng: -75.574, address: 'Provenza — Carrera 35, Medellín' },
  { lat: 6.256, lng: -75.59, address: 'Estadio Atanasio Girardot, Medellín' },
  { lat: 6.2234, lng: -75.5795, address: 'Ciudad del Río, Medellín' },
  { lat: 6.201, lng: -75.578, address: 'Las Palmas — acceso sur, Medellín' },
  { lat: 6.2789, lng: -75.555, address: 'Aranjuez — Parque Biblioteca, Medellín' },
  { lat: 6.235, lng: -75.552, address: 'Buenos Aires — Parque, Medellín' },
  { lat: 6.2476, lng: -75.565, address: 'Prado — Carrera 50, Medellín' },
];

const PASSENGER_NAMES = [
  'Ana Pérez',
  'Carlos Gómez',
  'María López',
  'Andrés Restrepo',
  'Laura Vargas',
  'Julián Mejía',
  'Camila Hoyos',
  'Santiago Ruiz',
];

const CATEGORIES: VehicleCategory[] = ['economy', 'xl', 'premium'];

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

/** Par origen/destino distintos en Medellín. */
export function randomMedellinTripPair(): { origin: LatLng; destination: LatLng } {
  const origin = MEDELLIN_PLACES[randInt(MEDELLIN_PLACES.length)]!;
  let destination = MEDELLIN_PLACES[randInt(MEDELLIN_PLACES.length)]!;
  let guard = 0;
  while (
    destination.lat === origin.lat &&
    destination.lng === origin.lng &&
    guard < 20
  ) {
    destination = MEDELLIN_PLACES[randInt(MEDELLIN_PLACES.length)]!;
    guard += 1;
  }
  return {
    origin: { ...origin },
    destination: { ...destination },
  };
}

/** Punto de partida del conductor cerca del origen (si no hay GPS). */
export function nearbyDriverStart(origin: LatLng): LatLng {
  const jitter = 0.012 + Math.random() * 0.01;
  const signLat = Math.random() > 0.5 ? 1 : -1;
  const signLng = Math.random() > 0.5 ? 1 : -1;
  return {
    lat: origin.lat + signLat * jitter,
    lng: origin.lng + signLng * jitter * 0.8,
    address: 'Tu ubicación',
  };
}

export function randomPassengerName() {
  return PASSENGER_NAMES[randInt(PASSENGER_NAMES.length)]!;
}

export function randomCategory(): VehicleCategory {
  return CATEGORIES[randInt(CATEGORIES.length)]!;
}

export const MEDELLIN_CENTER = { lat: 6.2442, lng: -75.5812 };
