/**
 * Worker: preferencias Mercado Pago + webhook → Firestore trips paid.
 * AI-assisted: see docs/AI_LOG.md #4
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} = require('firebase/firestore');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!MP_ACCESS_TOKEN) {
  console.error('Falta MERCADOPAGO_ACCESS_TOKEN en backend/.env');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  appId: process.env.FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.error('Faltan FIREBASE_* en backend/.env');
  process.exit(1);
}

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);
const mpConfig = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const mpPreference = new Preference(mpConfig);
const mpPayment = new Payment(mpConfig);

const PORT = Number(process.env.PORT || 4000);
const WEBHOOK_PUBLIC_URL = process.env.MP_WEBHOOK_URL || '';

async function markTripPaid(tripId, paymentId, paymentMethod = 'mercadopago') {
  if (!tripId) return;
  await updateDoc(doc(db, 'trips', String(tripId)), {
    paymentId: String(paymentId || `mp_${Date.now()}`),
    paymentStatus: 'approved',
    paymentMethod,
    status: 'paid',
    updatedAt: Date.now(),
  });
  console.log('Viaje marcado paid', tripId, paymentId);
}

async function createPreference(tripId, amount, title, successUrl, failureUrl) {
  const unitPrice = Math.round(Number(amount));
  const base = {
    items: [
      {
        id: String(tripId).slice(0, 100),
        title: String(title || `Viaje ${tripId}`).slice(0, 250),
        quantity: 1,
        unit_price: unitPrice,
        currency_id: 'COP',
      },
    ],
    external_reference: String(tripId),
  };

  if (WEBHOOK_PUBLIC_URL) {
    base.notification_url = WEBHOOK_PUBLIC_URL;
  }

  async function create(body) {
    const result = await mpPreference.create({ body });
    const initPoint = result.init_point;
    if (!initPoint) throw new Error('Preferencia sin init_point');
    return { preferenceId: result.id, initPoint };
  }

  if (successUrl && failureUrl) {
    try {
      const withBack = {
        ...base,
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: failureUrl,
        },
        auto_return: 'approved',
      };
      const pref = await create(withBack);
      console.log('init_point + back_urls OK', pref.initPoint);
      return pref;
    } catch (err) {
      console.warn('back_urls rechazadas, reintento sin ellas', err?.message || err);
    }
  }

  const pref = await create(base);
  console.log('init_point (sin back_urls)', pref.initPoint);
  return pref;
}

const q = query(
  collection(db, 'paymentRequests'),
  where('status', '==', 'pending')
);

console.log('Payment worker escuchando paymentRequests (pending)…');

onSnapshot(q, (snap) => {
  snap.docChanges().forEach(async (change) => {
    if (change.type !== 'added' && change.type !== 'modified') return;
    const ref = change.doc.ref;
    const data = change.doc.data();
    if (data.status !== 'pending') return;
    if (data.processing) return;

    try {
      await updateDoc(ref, { processing: true });

      // Stripe modo prueba: confirma sin SDK nativo (PaymentIntent simulado / real vía API HTTP)
      if (data.gateway === 'stripe') {
        const paymentIntentId = `pi_test_${data.tripId}_${Date.now()}`;
        await updateDoc(ref, {
          status: 'ready',
          preferenceId: paymentIntentId,
          initPoint: '',
          paymentIntentId,
          processing: false,
          updatedAt: Date.now(),
        });
        console.log('Stripe test intent listo', paymentIntentId);
        return;
      }

      console.log('Creando preferencia MP para', data.tripId, data.amount);
      const pref = await createPreference(
        data.tripId,
        data.amount,
        data.title,
        data.successUrl,
        data.failureUrl
      );
      if (!pref.initPoint) throw new Error('Sin initPoint');
      await updateDoc(ref, {
        status: 'ready',
        preferenceId: pref.preferenceId,
        initPoint: pref.initPoint,
        processing: false,
        updatedAt: Date.now(),
      });
      console.log('Preferencia lista', pref.preferenceId);
    } catch (err) {
      console.error('Error pago', err?.message || err);
      await updateDoc(ref, {
        status: 'error',
        error: String(err?.message || err),
        processing: false,
        updatedAt: Date.now(),
      });
    }
  });
});

/** HTTP: webhook MP + health (ngrok → MP_WEBHOOK_URL) */
const httpApp = express();
httpApp.use(cors());
httpApp.use(express.json());

httpApp.get('/health', (_req, res) => {
  res.json({ ok: true, mercadopago: true, webhook: Boolean(WEBHOOK_PUBLIC_URL) });
});

httpApp.post('/webhooks/mercadopago', async (req, res) => {
  try {
    console.log('MP webhook', JSON.stringify(req.query), JSON.stringify(req.body));
    const paymentId =
      req.query?.['data.id'] ||
      req.body?.data?.id ||
      req.body?.id ||
      req.query?.id;

    let tripId =
      req.body?.external_reference ||
      req.query?.external_reference ||
      null;
    let resolvedPaymentId = paymentId ? String(paymentId) : `mp_hook_${Date.now()}`;

    if (paymentId) {
      try {
        const payment = await mpPayment.get({ id: String(paymentId) });
        const status = payment?.status;
        tripId = payment?.external_reference || tripId;
        resolvedPaymentId = String(payment?.id || paymentId);
        if (status && status !== 'approved') {
          console.log('Webhook pago no aprobado:', status);
          return res.sendStatus(200);
        }
      } catch (err) {
        console.warn('No se pudo leer pago MP', err?.message || err);
      }
    }

    if (!tripId && req.body?.tripId) tripId = req.body.tripId;

    if (tripId) {
      await markTripPaid(tripId, resolvedPaymentId, 'mercadopago');
    } else {
      console.warn('Webhook sin tripId/external_reference');
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error', err?.message || err);
    res.sendStatus(500);
  }
});

/** Prueba manual: marca un viaje paid (útil sin ngrok) */
httpApp.post('/payments/mark-paid', async (req, res) => {
  try {
    const { tripId, paymentId, paymentMethod } = req.body || {};
    if (!tripId) return res.status(400).json({ error: 'tripId obligatorio' });
    await markTripPaid(tripId, paymentId || `manual_${Date.now()}`, paymentMethod || 'mercadopago');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

httpApp.listen(PORT, () => {
  console.log(`Worker HTTP en http://localhost:${PORT} (webhook /webhooks/mercadopago)`);
  if (!WEBHOOK_PUBLIC_URL) {
    console.log('Tip: para webhook real usa ngrok y MP_WEBHOOK_URL=https://xxx/webhooks/mercadopago');
  }
});
