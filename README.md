# UberClone — Versión Conductor

App móvil **Expo / React Native** para conductores: registro, disponibilidad, solicitudes en tiempo real, navegación en Medellín, cobro (Mercado Pago / Stripe prueba / efectivo), ganancias e historial.

Repositorio: [diego232005/UberClone](https://github.com/diego232005/UberClone.git)

## Stack

- Expo SDK 58 + TypeScript
- React Navigation (Stack + Drawer + Tabs de registro)
- Firebase Auth + Firestore
- Google Maps / Routes API (`react-native-maps`)
- Mercado Pago Checkout Pro (worker Node) + Stripe modo prueba
- Cloudinary (fotos)
- Hooks: `useDriverLocation`, `useTripRequests`, `useEarnings`

## Requisitos

- Node.js 20+
- Cuenta Expo Go (pruebas en celular)
- Proyecto Firebase, API key Google Maps, token de prueba Mercado Pago

## Instalación

```bash
cd UberCloneConductor
npm install
cp .env.example .env
# Completa EXPO_PUBLIC_* (Firebase, Maps, Cloudinary, USE_MOCK=false)
```

Backend / worker de pagos:

```bash
cd backend
npm install
cp .env.example .env
# MERCADOPAGO_ACCESS_TOKEN + FIREBASE_* (mismas claves del proyecto)
npm run worker
```

App:

```bash
npm start
# o: npx expo start --clear
```

## Variables de entorno

Ver `.env.example` y `backend/.env.example`.

| Variable | Dónde | Uso |
|---|---|---|
| `EXPO_PUBLIC_USE_MOCK` | app | `false` con Firebase real |
| `EXPO_PUBLIC_FIREBASE_*` | app | Auth + Firestore |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | app | Mapa y Routes API |
| `EXPO_PUBLIC_CLOUDINARY_*` | app | Subida de fotos |
| `MERCADOPAGO_ACCESS_TOKEN` | **solo backend** | Checkout Pro (nunca en la app) |
| `MP_WEBHOOK_URL` | backend | URL pública (ngrok) del webhook |
| `FIREBASE_*` | backend | Worker actualiza viajes |

## Flujo de demo

1. Registro (Datos / Vehículo / Documentos) → cuenta **Pendiente**.
2. Inicio → **Aprobar cuenta** → **Disponible**.
3. **Nueva solicitud** (rutas aleatorias en Medellín).
4. Aceptar (15 s) → hacia recogida → Pasajero a bordo → destino → Finalizar.
5. Cobrar con Mercado Pago, Stripe (prueba) o efectivo.
6. Revisar **Ganancias** e **Historial**.

## Tarifas

Configuración única: `src/config/pricing.js`  
Función pura: `src/utils/calculateFare.ts`

Ejemplo Económico 8,5 km / 22 min → tarifa **19.200**, comisión **3.840**, neto **15.360** COP.

## Estructura

```
src/
  config/          pricing, firebase, env
  screens/         auth, register, home, trip, earnings, history, profile
  services/        trips, payments, maps, cloudinary, fcm
  hooks/           useDriverLocation, useTripRequests, useEarnings
  data/            lugares Medellín
backend/
  paymentWorker.js preferencias MP + webhook → Firestore
docs/
  AI_LOG.md        bitácora de uso de IA
  README.md        índice de la bitácora
```

## Uso de IA

Ver [docs/README.md](docs/README.md) (índice) y la bitácora completa en [docs/AI_LOG.md](docs/AI_LOG.md).  
Para la entrega académica, exportar la bitácora a PDF.

## Notificaciones

- Expo Go: `expo-notifications`
- FCM nativo (`@react-native-firebase/messaging`): development build / EAS

## Licencia

Proyecto académico — UberClone Versión Conductor.
