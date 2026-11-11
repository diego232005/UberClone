import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDriver } from '../../context/DriverContext';
import { useEarnings, type EarningsSummary } from '../../hooks/useEarnings';
import { formatCop } from '../../utils/format';

function Card({ title, data }: { title: string; data: EarningsSummary }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text>Viajes: {data.trips}</Text>
      <Text>Facturado: {formatCop(data.billed)}</Text>
      <Text>Comisiones: {formatCop(data.commissions)}</Text>
      <Text>Propinas: {formatCop(data.tips)}</Text>
      <Text style={styles.net}>Ganancia neta: {formatCop(data.net)}</Text>
      <Text>Promedio/viaje: {formatCop(data.average)}</Text>
    </View>
  );
}

export function EarningsScreen() {
  const { driver } = useDriver();
  const { day, week, month, balance } = useEarnings(driver?.uid);

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Ganancias</Text>
      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>Saldo conductor</Text>
        <Text style={styles.balanceValue}>{formatCop(balance)}</Text>
      </View>
      <Card title="Hoy" data={day} />
      <Card title="Semana" data={week} />
      <Card title="Mes" data={month} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  balance: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
  },
  balanceLabel: { color: '#94a3b8' },
  balanceValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
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
