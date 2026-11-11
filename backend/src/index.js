require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const Stripe = require('stripe');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const stripeKey = process.env.STRIPE_SECRET_KEY;

const mpClient = mpToken ? new MercadoPagoConfig({ accessToken: mpToken }) : null;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    mercadopago: Boolean(mpToken),
    stripe: Boolean(stripeKey),
  });
});

/** Página HTML para simular checkout en modo mock (WebView). */
app.get('/mock-checkout', (req, res) => {
  const { tripId, amount } = req.query;
  res.type('html').send(`<!doctype html>
<html><body style="font-family:sans-serif;padding:24px">
  <h1>Checkout de prueba</h1>
  <p>Viaje: ${tripId || '-'} · Monto: ${amount || '-'} COP</p>
  <p>Usa el botón «Simular pago aprobado» en la app.</p>
</body></html>`);
});

/** Crea preferencia Checkout Pro. La access_token nunca va en la app. */
app.post('/payments/mercadopago/preference', async (req, res) => {
  try {
    const { tripId, amount, title } = req.body;
    if (!tripId || !amount) {
      return res.status(400).json({ error: 'tripId y amount son obligatorios' });
    }
    if (!mpClient) {
      return res.status(503).json({
        error: 'MERCADOPAGO_ACCESS_TOKEN no configurado',
        demo: true,
        initPoint: `https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=demo_${tripId}`,
        preferenceId: `demo_${tripId}`,
      });
    }

    const preference = new Preference(mpClient);
    const result = await preference.create({
      body: {
        items: [
          {
            id: tripId,
            title: title || `Viaje ${tripId}`,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: 'COP',
          },
        ],
        external_reference: tripId,
        back_urls: {
          success: process.env.MP_SUCCESS_URL || 'https://example.com/success',
          failure: process.env.MP_FAILURE_URL || 'https://example.com/failure',
          pending: process.env.MP_PENDING_URL || 'https://example.com/pending',
        },
        auto_return: 'approved',
        notification_url: process.env.MP_WEBHOOK_URL,
      },
    });

    return res.json({
      preferenceId: result.id,
      initPoint: result.init_point || result.sandbox_init_point,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creando preferencia' });
  }
});

app.post('/payments/stripe/intent', async (req, res) => {
  try {
    const { tripId, amount } = req.body;
    if (!tripId || !amount) {
      return res.status(400).json({ error: 'tripId y amount son obligatorios' });
    }
    if (!stripe) {
      return res.status(503).json({
        error: 'STRIPE_SECRET_KEY no configurado',
        demo: true,
        clientSecret: `demo_secret_${tripId}`,
        paymentIntentId: `pi_demo_${tripId}`,
      });
    }

    // Stripe COP usa unidades menores; para prueba usamos amount en centavos USD demo
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount)),
      currency: process.env.STRIPE_CURRENCY || 'usd',
      metadata: { tripId },
      automatic_payment_methods: { enabled: true },
    });

    return res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creando PaymentIntent' });
  }
});

/** Webhook simplificado: actualiza estado en tu BD (Firestore/Mongo) en producción. */
app.post('/webhooks/mercadopago', (req, res) => {
  console.log('MP webhook', JSON.stringify(req.body));
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Payments API on http://localhost:${PORT}`);
});
