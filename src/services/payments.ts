import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import * as ExpoLinking from 'expo-linking';
import { db, firebaseReady } from '../config/firebase';

export type PaymentPreference = {
  initPoint: string;
  preferenceId: string;
  /** Deep link que MP usa en "Volver a la tienda" / auto_return */
  successUrl: string;
  failureUrl: string;
};

/**
 * Deep links Checkout Pro — misma URL en preferencia MP y openAuthSessionAsync.
 * Expo Go: exp://…/--/mp-success ; build: ubercloneconductor://mp-success
 */
export function paymentReturnUrls(tripId: string) {
  return {
    successUrl: ExpoLinking.createURL('mp-success', {
      queryParams: { tripId, status: 'approved' },
    }),
    failureUrl: ExpoLinking.createURL('mp-failure', {
      queryParams: { tripId, status: 'rejected' },
    }),
  };
}

function waitPaymentRequest(
  tripId: string,
  amount: number,
  gateway: 'mercadopago' | 'stripe',
  successUrl?: string,
  failureUrl?: string
): Promise<PaymentPreference & { paymentIntentId?: string }> {
  if (!firebaseReady || !db) {
    return Promise.reject(
      new Error('Firebase no está listo (USE_MOCK=false y claves en .env)')
    );
  }

  return addDoc(collection(db, 'paymentRequests'), {
    tripId,
    amount: Math.round(Number(amount)),
    title: `Viaje UberClone ${tripId}`,
    status: 'pending',
    processing: false,
    gateway,
    successUrl: successUrl ?? null,
    failureUrl: failureUrl ?? null,
    createdAt: serverTimestamp(),
  }).then(
    (ref) =>
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          unsub();
          reject(
            new Error(
              'Timeout esperando preferencia. ¿Worker activo? cd backend && npm run worker'
            )
          );
        }, 45000);

        const unsub = onSnapshot(
          ref,
          (snap) => {
            const data = snap.data();
            if (!data) return;
            if (data.status === 'ready') {
              clearTimeout(timeout);
              unsub();
              resolve({
                initPoint: String(data.initPoint ?? ''),
                preferenceId: String(data.preferenceId ?? data.paymentIntentId ?? ''),
                successUrl: successUrl ?? '',
                failureUrl: failureUrl ?? '',
                paymentIntentId: data.paymentIntentId
                  ? String(data.paymentIntentId)
                  : undefined,
              });
            }
            if (data.status === 'error') {
              clearTimeout(timeout);
              unsub();
              reject(new Error(data.error || 'Error creando preferencia'));
            }
          },
          (err) => {
            clearTimeout(timeout);
            unsub();
            reject(err);
          }
        );
      })
  );
}

/**
 * Crea preferencia Mercado Pago vía Firestore (paymentRequests).
 * El worker en la PC genera el initPoint.
 */
export async function createPaymentPreference(
  tripId: string,
  amount: number
): Promise<PaymentPreference> {
  const { successUrl, failureUrl } = paymentReturnUrls(tripId);
  return waitPaymentRequest(tripId, amount, 'mercadopago', successUrl, failureUrl);
}

/** Stripe modo prueba (PDF §4): PaymentIntent vía worker, sin SDK nativo. */
export async function createStripeTestPayment(tripId: string, amount: number) {
  return waitPaymentRequest(tripId, amount, 'stripe');
}
