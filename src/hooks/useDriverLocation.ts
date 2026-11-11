import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '../types';
import { updateDriverLocation } from '../services/driverService';

/** Seguimiento GPS con limpieza en useEffect. AI-assisted: see docs/AI_LOG.md #2 */
export function useDriverLocation(
  driverId: string | undefined,
  enabled: boolean
) {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!enabled || !driverId) return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        return;
      }
      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 15,
        },
        (pos) => {
          if (cancelled) return;
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setLocation(next);
          void updateDriverLocation(driverId, next);
        }
      );
    }

    start();

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [driverId, enabled]);

  return { location, error };
}
