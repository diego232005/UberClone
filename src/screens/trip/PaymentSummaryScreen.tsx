// AI-assisted: see docs/AI_LOG.md #4
import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useDriver } from '../../context/DriverContext';
import {
  createPaymentPreference,
  createStripeTestPayment,
} from '../../services/payments';
import {
  listenActiveTrip,
  markCashPayment,
  markGatewayPayment,
} from '../../services/tripService';
import { formatCop } from '../../utils/format';
import { updateDriverProfile } from '../../services/driverService';
import { labelPaymentStatus } from '../../utils/labels';

WebBrowser.maybeCompleteAuthSession();

export function PaymentSummaryScreen({ navigation }: any) {
  const { activeTrip, setActiveTrip, driver, refreshDriver } = useDriver();
  const [preferenceId, setPreferenceId] = useState('');
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [balanceApplied, setBalanceApplied] = useState(false);

  const applyPaidBalance = useCallback(
    async (earnings: number) => {
      if (!driver || balanceApplied) return;
      setBalanceApplied(true);
      await updateDriverProfile(driver.uid, {
        balance: (driver.balance ?? 0) + earnings,
      });
      await refreshDriver();
    },
    [driver, balanceApplied, refreshDriver]
  );

  const confirmGatewayPaid = useCallback(
    async (paymentId?: string, method: 'mercadopago' | 'stripe' = 'mercadopago') => {
      if (!activeTrip || activeTrip.status === 'paid') return;
      setBusy(true);
      setError('');
      try {
        const next = await markGatewayPayment(
          activeTrip,
          paymentId || preferenceId || `pay_${Date.now()}`,
          'approved',
          method
        );
        await applyPaidBalance(next.driverEarnings);
        setActiveTrip(next);
        setCheckoutOpened(false);
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo confirmar el pago');
      } finally {
        setBusy(false);
      }
    },
    [activeTrip, preferenceId, applyPaidBalance, setActiveTrip]
  );

  // Escucha webhook / otro dispositivo que marque paid en Firestore
  useEffect(() => {
    if (!activeTrip?.id || activeTrip.status === 'paid') return;
    return listenActiveTrip(activeTrip.id, (trip) => {
      if (trip?.status === 'paid') {
        void applyPaidBalance(trip.driverEarnings);
        setActiveTrip(trip);
        setCheckoutOpened(false);
      }
    });
  }, [activeTrip?.id, activeTrip?.status, applyPaidBalance, setActiveTrip]);

  useEffect(() => {
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && checkoutOpened) {
        void confirmGatewayPaid();
      }
    });
    return () => appSub.remove();
  }, [checkoutOpened, confirmGatewayPaid]);

  if (!activeTrip) {
    return (
      <View style={styles.center}>
        <Text>Sin resumen</Text>
      </View>
    );
  }

  async function payMercadoPago() {
    setBusy(true);
    setError('');
    try {
      const pref = await createPaymentPreference(activeTrip!.id, activeTrip!.fare);
      setPreferenceId(pref.preferenceId);
      setCheckoutOpened(true);
      const result = await WebBrowser.openAuthSessionAsync(
        pref.initPoint,
        pref.successUrl
      );
      if (
        result.type === 'success' ||
        result.type === 'dismiss' ||
        result.type === 'cancel'
      ) {
        const url = 'url' in result ? String(result.url ?? '') : '';
        if (!url.includes('mp-failure')) {
          await confirmGatewayPaid(pref.preferenceId, 'mercadopago');
        } else {
          setError('Pago rechazado o cancelado en Mercado Pago');
          setCheckoutOpened(false);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error de Mercado Pago');
      setCheckoutOpened(false);
    } finally {
      setBusy(false);
    }
  }

  async function payStripe() {
    setBusy(true);
    setError('');
    try {
      const intent = await createStripeTestPayment(
        activeTrip!.id,
        activeTrip!.fare
      );
      setPreferenceId(intent.paymentIntentId || intent.preferenceId);
      await confirmGatewayPaid(
        intent.paymentIntentId || intent.preferenceId,
        'stripe'
      );
    } catch (e: any) {
      setError(e?.message ?? 'Error de Stripe');
    } finally {
      setBusy(false);
    }
  }

  async function onCash() {
    setBusy(true);
    setError('');
    try {
      const next = await markCashPayment(activeTrip!);
      if (driver) {
        await updateDriverProfile(driver.uid, {
          balance: (driver.balance ?? 0) - next.commission,
        });
        await refreshDriver();
      }
      setActiveTrip(next);
    } catch (e: any) {
      setError(e?.message ?? 'Error al registrar efectivo');
    } finally {
      setBusy(false);
    }
  }

  const paid = activeTrip.status === 'paid';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cobro y resumen</Text>
      <Row label="Tarifa final" value={formatCop(activeTrip.fare)} />
      <Row label="Comisión plataforma" value={formatCop(activeTrip.commission)} />
      <Row label="Ganancia neta" value={formatCop(activeTrip.driverEarnings)} />
      <Row
        label="Estado pago"
        value={labelPaymentStatus(
          paid ? activeTrip.paymentStatus ?? 'approved' : activeTrip.paymentStatus
        )}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!paid ? (
        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={payMercadoPago} disabled={busy}>
            <Text style={styles.btnText}>
              {busy ? 'Procesando…' : 'Cobrar con Mercado Pago'}
            </Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={payStripe} disabled={busy}>
            <Text style={styles.btnText}>Cobrar con Stripe (prueba)</Text>
          </Pressable>
          {checkoutOpened ? (
            <Pressable
              style={styles.btn}
              onPress={() => void confirmGatewayPaid()}
              disabled={busy}
            >
              <Text style={styles.btnText}>Ya volví — Confirmar pago</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.secondary} onPress={onCash} disabled={busy}>
            <Text style={styles.secondaryText}>Marcar efectivo recibido</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.btn}
          onPress={() => {
            setActiveTrip(null);
            navigation.popToTop();
          }}
        >
          <Text style={styles.btnText}>Volver al inicio</Text>
        </Pressable>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc', gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
  },
  label: { color: '#64748b' },
  value: { fontWeight: '700', color: '#0f172a' },
  actions: { marginTop: 16, gap: 10 },
  btn: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  secondary: {
    backgroundColor: '#e2e8f0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { fontWeight: '700', color: '#0f172a' },
  error: { color: '#dc2626', marginTop: 8, marginBottom: 4 },
});
