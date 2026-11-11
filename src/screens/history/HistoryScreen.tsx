// AI-assisted: see docs/AI_LOG.md #4
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { DateField } from '../../components/DateField';
import { useDriver } from '../../context/DriverContext';
import { fetchDriverHistory } from '../../services/tripService';
import type { PaymentMethod, Trip } from '../../types';
import { formatCop } from '../../utils/format';
import {
  labelCategory,
  labelPaymentMethod,
  labelPaymentStatus,
} from '../../utils/labels';

type Range = 'today' | 'week' | 'month' | 'custom' | 'all';

const RANGE_LABEL: Record<Range, string> = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
  custom: 'Rango',
  all: 'Todo',
};

export function HistoryScreen() {
  const { driver } = useDriver();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [range, setRange] = useState<Range>('all');
  const [payment, setPayment] = useState<PaymentMethod | 'all'>('all');
  const [selected, setSelected] = useState<Trip | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (!driver) return;
    void fetchDriverHistory(driver.uid, 20).then(setTrips);
  }, [driver]);

  const filtered = useMemo(() => {
    const now = new Date();
    return trips.filter((t) => {
      const ts = t.completedAt ?? t.createdAt;
      let okRange = true;
      if (range === 'today')
        okRange = ts >= startOfDay(now).getTime() && ts <= endOfDay(now).getTime();
      if (range === 'week')
        okRange =
          ts >= startOfWeek(now, { weekStartsOn: 1 }).getTime() &&
          ts <= endOfWeek(now, { weekStartsOn: 1 }).getTime();
      if (range === 'month')
        okRange =
          ts >= startOfMonth(now).getTime() && ts <= endOfMonth(now).getTime();
      if (range === 'custom') {
        if (!fromDate || !toDate) okRange = false;
        else {
          const from = startOfDay(new Date(`${fromDate}T12:00:00`)).getTime();
          const to = endOfDay(new Date(`${toDate}T12:00:00`)).getTime();
          okRange = ts >= from && ts <= to;
        }
      }
      const okPay = payment === 'all' || t.paymentMethod === payment;
      return okRange && okPay;
    });
  }, [trips, range, payment, fromDate, toDate]);

  if (selected) {
    const poly =
      selected.routePolyline?.map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
      })) ?? [];
    return (
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: selected.origin.lat,
            longitude: selected.origin.lng,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {poly.length > 1 ? (
            <Polyline coordinates={poly} strokeWidth={4} strokeColor="#0f172a" />
          ) : null}
        </MapView>
        <View style={styles.detail}>
          <Text style={styles.title}>Detalle</Text>
          <Text>
            {selected.origin.address} → {selected.destination.address}
          </Text>
          <Text>
            {selected.distanceKm} km · {selected.durationMin} min
          </Text>
          <Text>Comisión: {formatCop(selected.commission)}</Text>
          <Text>Propina: {formatCop(selected.tip || 0)}</Text>
          <Text>Calificación: {selected.rating ?? '—'}</Text>
          <Pressable onPress={() => setSelected(null)}>
            <Text style={styles.link}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial</Text>
      <View style={styles.filters}>
        {(['today', 'week', 'month', 'custom', 'all'] as Range[]).map((r) => (
          <Chip
            key={r}
            label={RANGE_LABEL[r]}
            active={range === r}
            onPress={() => setRange(r)}
          />
        ))}
      </View>
      {range === 'custom' ? (
        <View style={styles.rangeBox}>
          <DateField label="Desde" value={fromDate} onChange={setFromDate} />
          <DateField label="Hasta" value={toDate} onChange={setToDate} />
        </View>
      ) : null}
      <View style={styles.filters}>
        {(['all', 'mercadopago', 'stripe', 'cash'] as const).map((p) => (
          <Chip
            key={p}
            label={p === 'all' ? 'Todos' : labelPaymentMethod(p)}
            active={payment === p}
            onPress={() => setPayment(p)}
          />
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay viajes en este filtro</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => setSelected(item)}>
            <Text style={styles.itemTitle}>
              {new Date(item.createdAt).toLocaleString('es-CO')}
            </Text>
            <Text numberOfLines={1}>
              {item.origin.address} → {item.destination.address}
            </Text>
            <Text>
              {labelCategory(item.category)} · {formatCop(item.fare)} · neto{' '}
              {formatCop(item.driverEarnings)}
            </Text>
            <Text style={styles.meta}>
              Pago: {labelPaymentStatus(item.paymentStatus ?? item.status)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipOn]}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  rangeBox: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  chipOn: { backgroundColor: '#0f172a' },
  chipText: { color: '#334155', fontSize: 12 },
  chipTextOn: { color: '#fff' },
  item: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 2,
  },
  itemTitle: { fontWeight: '700' },
  meta: { color: '#64748b', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: '#64748b' },
  detail: { padding: 16, backgroundColor: '#fff', gap: 6 },
  link: { color: '#2563eb', marginTop: 8, fontWeight: '600' },
});
