import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, firebaseReady } from '../config/firebase';
import type { LatLng, PaymentStatus, Trip, TripStatus } from '../types';
import { calculateFare, COMMISSION_RATE } from '../utils/calculateFare';
import { nearbyDriverStart } from '../data/medellinPlaces';
import { fetchRoute } from './googleMaps';
import {
  createMockRequest,
  getMockTrips,
  subscribeMockTrips,
  upsertMockTrip,
} from './mockStore';

export function listenTripRequests(
  driverId: string,
  onChange: (trips: Trip[]) => void
) {
  if (!firebaseReady || !db) {
    const emit = async () => {
      const all = await getMockTrips();
      onChange(
        all.filter(
          (t) =>
            t.status === 'requested' &&
            (!t.driverId || t.driverId === driverId)
        )
      );
    };
    emit();
    return subscribeMockTrips(() => {
      void emit();
    });
  }

  // Solo where (sin orderBy) para no exigir índice compuesto en clase.
  const q = query(
    collection(db, 'trips'),
    where('status', '==', 'requested'),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      const trips = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Trip))
        .filter((t) => !t.driverId || t.driverId === driverId)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        .slice(0, 5);
      onChange(trips);
    },
    (err) => {
      console.warn('listenTripRequests', err);
      onChange([]);
    }
  );
}

export function listenActiveTrip(
  tripId: string,
  onChange: (trip: Trip | null) => void
) {
  if (!firebaseReady || !db) {
    const emit = async () => {
      const all = await getMockTrips();
      onChange(all.find((t) => t.id === tripId) ?? null);
    };
    emit();
    return subscribeMockTrips(() => {
      void emit();
    });
  }
  return onSnapshot(doc(db, 'trips', tripId), (snap) => {
    onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Trip) : null);
  });
}

export async function acceptTrip(
  trip: Trip,
  driverId: string,
  driverLocation?: LatLng | null
) {
  const start = driverLocation ?? nearbyDriverStart(trip.origin);
  const pickup = await fetchRoute(start, trip.origin);
  const next: Trip = {
    ...trip,
    driverId,
    status: 'driver_arriving',
    pickupPolyline: pickup.polyline,
  };
  if (!firebaseReady || !db) {
    await upsertMockTrip(next);
    return next;
  }
  await updateDoc(doc(db, 'trips', trip.id), {
    driverId,
    status: 'driver_arriving',
    pickupPolyline: pickup.polyline,
  });
  return next;
}

export async function rejectTrip(trip: Trip) {
  const next: Trip = { ...trip, status: 'rejected' };
  if (!firebaseReady || !db) {
    await upsertMockTrip(next);
    return next;
  }
  await updateDoc(doc(db, 'trips', trip.id), { status: 'rejected' });
  return next;
}

export async function setTripStatus(trip: Trip, status: TripStatus) {
  let next: Trip = { ...trip, status };
  if (status === 'completed') {
    const calc = calculateFare({
      distanceKm: trip.distanceKm,
      durationMin: trip.durationMin,
      category: trip.category,
      tip: trip.tip,
    });
    next = {
      ...next,
      ...calc,
      commissionRate: COMMISSION_RATE,
      completedAt: Date.now(),
    };
  }
  if (!firebaseReady || !db) {
    await upsertMockTrip(next);
    return next;
  }
  const { id, ...data } = next;
  await updateDoc(doc(db, 'trips', id), data);
  return next;
}

export async function markCashPayment(trip: Trip) {
  const next: Trip = {
    ...trip,
    paymentMethod: 'cash',
    paymentStatus: 'cash',
    status: 'paid',
  };
  if (!firebaseReady || !db) {
    await upsertMockTrip(next);
    return next;
  }
  await updateDoc(doc(db, 'trips', trip.id), {
    paymentMethod: 'cash',
    paymentStatus: 'cash',
    status: 'paid',
  });
  return next;
}

export async function markGatewayPayment(
  trip: Trip,
  paymentId: string,
  paymentStatus: PaymentStatus,
  paymentMethod: Trip['paymentMethod'] = 'mercadopago'
) {
  // AI-assisted: see docs/AI_LOG.md #4
  const next: Trip = {
    ...trip,
    paymentId,
    paymentStatus,
    paymentMethod,
    status: paymentStatus === 'approved' ? 'paid' : trip.status,
  };
  if (!firebaseReady || !db) {
    await upsertMockTrip(next);
    return next;
  }
  await updateDoc(doc(db, 'trips', trip.id), {
    paymentId,
    paymentStatus,
    paymentMethod,
    status: paymentStatus === 'approved' ? 'paid' : trip.status,
  });
  return next;
}

export async function fetchDriverHistory(driverId: string, pageSize = 20) {
  if (!firebaseReady || !db) {
    const all = await getMockTrips();
    return all
      .filter((t) => t.driverId === driverId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, pageSize);
  }
  // Solo where + orden en cliente (evita índice compuesto driverId+createdAt).
  const q = query(collection(db, 'trips'), where('driverId', '==', driverId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Trip))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, pageSize);
}

/** Solicitud demo Medellín (ruta recogida→destino con Routes API). */
export async function spawnDemoRequest(driverId: string) {
  const base = createMockRequest(driverId);
  const route = await fetchRoute(base.origin, base.destination);
  const calc = calculateFare({
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    category: base.category,
    tip: base.tip,
  });
  const trip: Trip = {
    ...base,
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    routePolyline: route.polyline,
    fare: calc.fare,
    commission: calc.commission,
    driverEarnings: calc.driverEarnings,
    commissionRate: COMMISSION_RATE,
  };

  if (!firebaseReady || !db) {
    await upsertMockTrip(trip);
    return trip;
  }
  const { id, ...data } = trip;
  await setDoc(doc(db, 'trips', id), data);
  return trip;
}
