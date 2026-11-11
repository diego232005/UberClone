import { ENV } from '../config/env';
import type { LatLng } from '../types';

type RouteResult = {
  distanceKm: number;
  durationMin: number;
  polyline: LatLng[];
};

function fallbackRoute(origin: LatLng, destination: LatLng): RouteResult {
  const distanceKm =
    Math.hypot(destination.lat - origin.lat, destination.lng - origin.lng) * 111;
  return {
    distanceKm: Number(distanceKm.toFixed(1)),
    durationMin: Math.max(5, Math.round(distanceKm * 2.5)),
    polyline: [origin, destination],
  };
}

/**
 * Ruta con Routes API (Directions Legacy ya no se habilita en proyectos nuevos).
 * Una sola llamada al aceptar/estimar; no en cada tick de GPS.
 * AI-assisted: see docs/AI_LOG.md #3
 */
export async function fetchRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult> {
  if (!ENV.GOOGLE_MAPS_API_KEY) {
    return fallbackRoute(origin, destination);
  }

  const res = await fetch(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': ENV.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: origin.lat, longitude: origin.lng },
          },
        },
        destination: {
          location: {
            latLng: { latitude: destination.lat, longitude: destination.lng },
          },
        },
        travelMode: 'DRIVE',
        languageCode: 'es-CO',
        units: 'METRIC',
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.warn('Routes API error:', text);
    return fallbackRoute(origin, destination);
  }

  const data = (await res.json()) as {
    routes?: Array<{
      distanceMeters?: number;
      duration?: string;
      polyline?: { encodedPolyline?: string };
    }>;
  };

  const route = data.routes?.[0];
  if (!route?.distanceMeters) {
    return fallbackRoute(origin, destination);
  }

  const durationSec = Number(String(route.duration ?? '0s').replace('s', '')) || 0;

  return {
    distanceKm: Number((route.distanceMeters / 1000).toFixed(1)),
    durationMin: Math.max(1, Math.round(durationSec / 60)),
    polyline: route.polyline?.encodedPolyline
      ? decodePolyline(route.polyline.encodedPolyline)
      : [origin, destination],
  };
}

function decodePolyline(encoded: string): LatLng[] {
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const path: LatLng[] = [];
  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return path;
}
