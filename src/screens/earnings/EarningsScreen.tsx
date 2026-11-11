import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDriver } from '../../context/DriverContext';
import { useEarnings, type EarningsSummary } from '../../hooks/useEarnings';
import { formatCop } from '../../utils/format';

function Card({ title, data }: { title: string; data: EarningsSummary }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text>Viajes: {data.trips}</Text>
      <Text>Facturado: {formatCop(data.billed || 0)}</Text>
      <Text>Comisiones: {formatCop(data.commissions || 0)}</Text>
      <Text>Propinas: {formatCop(data.tips || 0)}</Text>
      <Text style={styles.net}>
        Ganancia neta: {formatCop(data.net || 0)}
      </Text>
      <Text>Promedio/viaje: {formatCop(data.average || 0)}</Text>
    </View>
  );
}

export function EarningsScreen() {
  const { driver } = useDriver();
  const { day, week, month, balance, hasTrips, loading, error, refresh } =
    useEarnings(driver?.uid, driver?.balance ?? 0);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Ganancias</Text>
      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>Saldo conductor</Text>
        <Text style={styles.balanceValue}>{formatCop(balance || 0)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: 12 }} color="#0f172a" />
      ) : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}

      {!loading && !hasTrips ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sin viajes cobrados aún</Text>
          <Text style={styles.emptyText}>
            Cuando completes un viaje y confirmes el pago (Mercado Pago, Stripe
            o efectivo), aquí verás el resumen de hoy, semana y mes.
          </Text>
          <Pressable style={styles.refresh} onPress={() => void refresh()}>
            <Text style={styles.refreshText}>Actualizar</Text>
          </Pressable>
        </View>
      ) : null}

      <Card title="Hoy" data={day} />
      <Card title="Semana" data={week} />
      <Card title="Mes" data={month} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800' },
  balance: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
  },
  balanceLabel: { color: '#94a3b8' },
  balanceValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  empty: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  emptyTitle: { fontWeight: '800', color: '#9a3412' },
  emptyText: { color: '#9a3412', lineHeight: 20 },
  refresh: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: { color: '#fff', fontWeight: '700' },
  err: { color: '#dc2626' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  net: { color: '#15803d', fontWeight: '700' },
});
