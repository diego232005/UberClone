import { useCallback, useEffect, useRef, useState } from 'react';
import type { LatLng, Trip } from '../types';
import {
  acceptTrip,
  listenTripRequests,
  rejectTrip,
  spawnDemoRequest,
} from '../services/tripService';
import { notifyIncomingTrip } from '../services/notifications';

export function useTripRequests(driverId: string | undefined, available: boolean) {
  const [incoming, setIncoming] = useState<Trip | null>(null);
  const lastNotified = useRef<string | null>(null);

  useEffect(() => {
    if (!driverId || !available) {
      setIncoming(null);
      return;
    }
    return listenTripRequests(driverId, (trips) => {
      const trip = trips[0] ?? null;
      setIncoming(trip);
      if (trip && trip.id !== lastNotified.current) {
        lastNotified.current = trip.id;
        void notifyIncomingTrip(
          `${trip.origin.address ?? 'Origen'} → ${trip.destination.address ?? 'Destino'}`
        );
      }
    });
  }, [driverId, available]);

  const accept = useCallback(
    async (driverLocation?: LatLng | null) => {
      if (!incoming || !driverId) return null;
      const next = await acceptTrip(incoming, driverId, driverLocation);
      setIncoming(null);
      return next;
    },
    [incoming, driverId]
  );

  const reject = useCallback(async () => {
    if (!incoming) return;
    await rejectTrip(incoming);
    setIncoming(null);
  }, [incoming]);

  const simulate = useCallback(async () => {
    if (!driverId) return;
    await spawnDemoRequest(driverId);
  }, [driverId]);

  return { incoming, accept, reject, simulate };
}
