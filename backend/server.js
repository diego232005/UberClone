require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

app.get('/health', (_req, res) =>
  res.json({
    ok: true,
    mercadopago: Boolean(MP_ACCESS_TOKEN),
  })
);

app.get('/payments/success', (req, res) => {
  const { tripId, status } = req.query;
  res.type('html').send(`<!doctype html>
<html><body style="font-family:sans-serif;padding:24px;text-align:center">
  <h1>Pago ${status === 'rejected' ? 'rechazado' : 'procesado'}</h1>
  <p>Viaje: ${tripId || '-'}</p>
  <p>Vuelve a la app y toca <b>Confirmar pago</b>.</p>
</body></html>`);
});

app.post('/payments/mercadopago/preference', async (req, res) => {
  try {
    const { tripId, amount, title } = req.body;
    if (!tripId || amount == null) {
      return res.status(400).json({ error: 'tripId y amount requeridos' });
    }
    if (!MP_ACCESS_TOKEN) {
      return res.status(500).json({
        error: 'Falta MERCADOPAGO_ACCESS_TOKEN en backend/.env',
      });
    }

    const unitPrice = Math.round(Number(amount));
    if (!Number.isFinite(unitPrice) || unitPrice < 1) {
      return res.status(400).json({ error: 'amount inválido' });
    }

    const publicBase =
      process.env.PUBLIC_URL || `http://192.168.40.28:${PORT}`;

    const { MercadoPagoConfig, Preference } = require('mercadopago');
    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    // back_urls públicas/simples; sin auto_return (falla con localhost)
    const result = await preference.create({
      body: {
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
        back_urls: {
          success: `${publicBase}/payments/success?status=approved&tripId=${encodeURIComponent(tripId)}`,
          failure: `${publicBase}/payments/success?status=rejected&tripId=${encodeURIComponent(tripId)}`,
          pending: `${publicBase}/payments/success?status=pending&tripId=${encodeURIComponent(tripId)}`,
        },
        notification_url: process.env.MP_WEBHOOK_URL || undefined,
      },
    });

    const initPoint = result.init_point || result.sandbox_init_point;
    if (!initPoint) {
      console.error('MP response sin init_point', result);
      return res.status(502).json({ error: 'Mercado Pago no devolvió init_point' });
    }

    return res.json({
      preferenceId: result.id,
      initPoint,
    });
  } catch (err) {
    console.error('MP preference error', err?.message || err);
    const detail =
      err?.cause?.message ||
      err?.message ||
      (typeof err === 'string' ? err : 'No se pudo crear preferencia');
    return res.status(500).json({ error: detail });
  }
});

app.post('/webhooks/mercadopago', (req, res) => {
  console.log('MP webhook', JSON.stringify(req.body));
  res.sendStatus(200);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend en http://0.0.0.0:${PORT} | MP=${Boolean(MP_ACCESS_TOKEN)}`);
});
