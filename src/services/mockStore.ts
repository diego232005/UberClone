import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DriverProfile, Trip } from '../types';
import { calculateFare, COMMISSION_RATE } from '../utils/calculateFare';
import {
  randomCategory,
  randomMedellinTripPair,
  randomPassengerName,
} from '../data/medellinPlaces';

const DRIVER_KEY = 'mock_driver_session';
const TRIPS_KEY = 'mock_trips';

type Listener = () => void;
const tripListeners = new Set<Listener>();

function notifyTrips() {
  tripListeners.forEach((l) => l());
}

export function subscribeMockTrips(listener: Listener) {
  tripListeners.add(listener);
  return () => tripListeners.delete(listener);
}

export async function getMockDriver(): Promise<DriverProfile | null> {
  const raw = await AsyncStorage.getItem(DRIVER_KEY);
  return raw ? (JSON.parse(raw) as DriverProfile) : null;
}

export async function saveMockDriver(driver: DriverProfile) {
  await AsyncStorage.setItem(DRIVER_KEY, JSON.stringify(driver));
}

export async function clearMockDriver() {
  await AsyncStorage.removeItem(DRIVER_KEY);
}

export async function getMockTrips(): Promise<Trip[]> {
  const raw = await AsyncStorage.getItem(TRIPS_KEY);
  return raw ? (JSON.parse(raw) as Trip[]) : seedTrips();
}

async function seedTrips(): Promise<Trip[]> {
  const sample: Trip[] = [];
  await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(sample));
  return sample;
}

export async function saveMockTrips(trips: Trip[]) {
  await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  notifyTrips();
}

export async function upsertMockTrip(trip: Trip) {
  const trips = await getMockTrips();
  const idx = trips.findIndex((t) => t.id === trip.id);
  if (idx >= 0) trips[idx] = trip;
  else trips.unshift(trip);
  await saveMockTrips(trips);
}

/** Solicitud demo en Medellín (origen/destino distintos al azar). */
export function createMockRequest(driverId: string): Trip {
  const { origin, destination } = randomMedellinTripPair();
  const category = randomCategory();
  const distanceKm = 8.5;
  const durationMin = 22;
  const { fare, commission, driverEarnings } = calculateFare({
    distanceKm,
    durationMin,
    category,
  });
  return {
    id: `trip_${Date.now()}`,
    driverId,
    passengerId: `pasajero_${Date.now()}`,
    passengerName: randomPassengerName(),
    origin,
    destination,
    distanceKm,
    durationMin,
    category,
    fare,
    commission,
    tip: 0,
    driverEarnings,
    commissionRate: COMMISSION_RATE,
    paymentMethod: 'mercadopago',
    status: 'requested',
    createdAt: Date.now(),
  };
}
