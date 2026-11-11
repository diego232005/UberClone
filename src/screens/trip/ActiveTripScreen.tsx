import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useDriver } from '../../context/DriverContext';
import { setTripStatus } from '../../services/tripService';
import type { LatLng } from '../../types';

type Phase = 'to_pickup' | 'to_destination';
type Speed = 1 | 1.5 | 2;

const SPEED_OPTIONS: Speed[] = [1, 1.5, 2];
/** Duración objetivo de cada tramo a velocidad x1. */
const PHASE_DURATION_MS = 15_000;

function densifyPath(points: LatLng[], stepsPerSegment = 12): LatLng[] {
  if (points.length < 2) return points;
  const out: LatLng[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      out.push({
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
      });
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

export function ActiveTripScreen({ navigation }: any) {
  const { activeTrip, setActiveTrip } = useDriver();
  const mapRef = useRef<MapView>(null);
  const [carIndex, setCarIndex] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1.5);
  const [followCar, setFollowCar] = useState(true);

  const phase: Phase =
    activeTrip?.status === 'in_progress' ? 'to_destination' : 'to_pickup';

  /** Tramo actual: conductor→recogida o recogida→destino (rutas distintas). */
  const segment = useMemo(() => {
    if (!activeTrip) return [] as LatLng[];
    if (phase === 'to_pickup') {
      const pts =
        activeTrip.pickupPolyline?.length && activeTrip.pickupPolyline.length > 1
          ? activeTrip.pickupPolyline
          : [
              activeTrip.pickupPolyline?.[0] ?? {
                lat: activeTrip.origin.lat + 0.01,
                lng: activeTrip.origin.lng + 0.01,
              },
              activeTrip.origin,
            ];
      return densifyPath(pts, 8);
    }
    const pts =
      activeTrip.routePolyline?.length && activeTrip.routePolyline.length > 1
        ? activeTrip.routePolyline
        : [activeTrip.origin, activeTrip.destination];
    return densifyPath(pts, 8);
  }, [activeTrip, phase]);

  const mapCoords = useMemo(
    () => segment.map((p) => ({ latitude: p.lat, longitude: p.lng })),
    [segment]
  );

  useEffect(() => {
    setCarIndex(0);
    setArrived(false);
  }, [phase, activeTrip?.id]);

  useEffect(() => {
    if (!segment.length || arrived) return undefined;
    const steps = Math.max(1, segment.length - 1);
    const duration = PHASE_DURATION_MS / speed;
    const tick = Math.max(16, Math.floor(duration / steps));
    const stepSize = Math.max(1, Math.ceil(steps / (duration / tick)));

    const id = setInterval(() => {
      setCarIndex((i) => {
        const next = i + stepSize;
        if (next >= segment.length - 1) {
          setArrived(true);
          return segment.length - 1;
        }
        return next;
      });
    }, tick);
    return () => clearInterval(id);
  }, [segment, arrived, phase, speed]);

  const car = segment[Math.min(carIndex, Math.max(0, segment.length - 1))];

  useEffect(() => {
    if (!followCar || !car || !mapRef.current) return;
    mapRef.current.animateCamera(
      { center: { latitude: car.lat, longitude: car.lng } },
      { duration: 250 }
    );
  }, [car?.lat, car?.lng, followCar]);

  if (!activeTrip || !car) {
    return (
      <View style={styles.center}>
        <Text>No hay viaje activo</Text>
      </View>
    );
  }

  const progress =
    segment.length > 1
      ? Math.round((carIndex / (segment.length - 1)) * 100)
      : 0;

  const target =
    phase === 'to_destination' ? activeTrip.destination : activeTrip.origin;

  async function passengerOnBoard() {
    if (!arrived || busy) return;
    setBusy(true);
    try {
      const next = await setTripStatus(activeTrip!, 'in_progress');
      setActiveTrip(next);
    } finally {
      setBusy(false);
    }
  }

  async function finishTrip() {
    if (!arrived || busy) return;
    setBusy(true);
    try {
      const next = await setTripStatus(activeTrip!, 'completed');
      setActiveTrip(next);
      navigation.replace('PaymentSummary');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: car.lat,
          longitude: car.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPanDrag={() => setFollowCar(false)}
      >
        {mapCoords.length > 1 ? (
          <Polyline coordinates={mapCoords} strokeWidth={4} strokeColor="#0f172a" />
        ) : null}
        <Marker
          coordinate={{
            latitude: activeTrip.origin.lat,
            longitude: activeTrip.origin.lng,
          }}
          title="Recogida"
          pinColor="green"
        />
        <Marker
          coordinate={{
            latitude: activeTrip.destination.lat,
            longitude: activeTrip.destination.lng,
          }}
          title="Destino"
          pinColor="red"
        />
        <Marker
          coordinate={{ latitude: car.lat, longitude: car.lng }}
          title="Tú"
          description="Conductor"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.car}>
            <Text style={styles.carEmoji}>🚗</Text>
          </View>
        </Marker>
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.title}>
          {phase === 'to_pickup' ? 'Hacia el pasajero' : 'Hacia el destino'}
        </Text>
        <Text style={styles.addr}>{target.address}</Text>
        <View style={styles.speedRow}>
          <Text style={styles.speedLabel}>Velocidad</Text>
          {SPEED_OPTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSpeed(s)}
              style={[styles.speedChip, speed === s && styles.speedChipOn]}
            >
              <Text style={[styles.speedChipText, speed === s && styles.speedChipTextOn]}>
                x{s}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setFollowCar(true)}
            style={[styles.speedChip, followCar && styles.speedChipOn]}
          >
            <Text style={[styles.speedChipText, followCar && styles.speedChipTextOn]}>
              Seguir
            </Text>
          </Pressable>
        </View>
        <Text style={styles.progress}>
          {arrived
            ? phase === 'to_pickup'
              ? 'Llegaste al punto de recogida'
              : 'Llegaste al destino'
            : `En camino… ${progress}%`}
        </Text>

        {phase === 'to_pickup' ? (
          <Pressable
            style={[styles.btn, (!arrived || busy) && styles.btnDisabled]}
            onPress={passengerOnBoard}
            disabled={!arrived || busy}
          >
            <Text style={styles.btnText}>
              {arrived ? 'Pasajero a bordo' : 'Espera a llegar…'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btn, (!arrived || busy) && styles.btnDisabled]}
            onPress={finishTrip}
            disabled={!arrived || busy}
          >
            <Text style={styles.btnText}>
              {arrived ? 'Finalizar viaje' : 'Espera a llegar…'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    elevation: 4,
  },
  title: { fontSize: 18, fontWeight: '800' },
  addr: { color: '#64748b' },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  speedLabel: { color: '#64748b', fontSize: 13, marginRight: 4 },
  speedChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  speedChipOn: { backgroundColor: '#0f172a' },
  speedChipText: { fontWeight: '700', color: '#0f172a', fontSize: 13 },
  speedChipTextOn: { color: '#fff' },
  progress: { color: '#15803d', fontWeight: '600', marginTop: 4 },
  btn: {
    marginTop: 8,
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: '#fff', fontWeight: '700' },
  car: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  carEmoji: { fontSize: 28 },
});
