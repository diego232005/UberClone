import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Trip } from '../../types';
import { labelCategory, labelPaymentMethod } from '../../utils/labels';

type Props = {
  trip: Trip | null;
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
  formatFare: (n: number) => string;
};

export function IncomingRequestModal({
  trip,
  visible,
  onAccept,
  onReject,
  formatFare,
}: Props) {
  const [seconds, setSeconds] = useState(15);

  useEffect(() => {
    if (!visible || !trip) return;
    setSeconds(15);
    const id = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [visible, trip?.id]);

  useEffect(() => {
    if (seconds <= 0 && visible) {
      onReject();
    }
  }, [seconds, visible, onReject]);

  const accept = useCallback(() => onAccept(), [onAccept]);

  if (!trip) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Solicitud entrante · {seconds}s</Text>
          <Text style={styles.line}>{trip.origin.address}</Text>
          <Text style={styles.arrow}>↓</Text>
          <Text style={styles.line}>{trip.destination.address}</Text>
          <Text style={styles.meta}>
            {trip.distanceKm} km · {trip.durationMin} min ·{' '}
            {labelCategory(trip.category)}
          </Text>
          <Text style={styles.meta}>
            Pago: {labelPaymentMethod(trip.paymentMethod)}
          </Text>
          <Text style={styles.fare}>Tarifa est. {formatFare(trip.fare)}</Text>
          <Text style={styles.net}>
            Tu ganancia est. {formatFare(trip.driverEarnings)}
          </Text>
          <View style={styles.actions}>
            <Pressable style={styles.reject} onPress={onReject}>
              <Text style={styles.rejectText}>Rechazar</Text>
            </Pressable>
            <Pressable style={styles.accept} onPress={accept}>
              <Text style={styles.acceptText}>Aceptar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    gap: 6,
  },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  line: { color: '#0f172a', fontSize: 15 },
  arrow: { color: '#94a3b8', textAlign: 'center' },
  meta: { color: '#64748b', marginTop: 4 },
  fare: { marginTop: 8, fontWeight: '600' },
  net: { color: '#15803d', fontWeight: '700', fontSize: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  reject: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  rejectText: { color: '#b91c1c', fontWeight: '700' },
  accept: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '700' },
});
