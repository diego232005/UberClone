# Bitácora de uso de IA

Herramientas permitidas documentadas según el instructivo del proyecto.

---

### Entrada #1
- Fecha: 2026-10-26
- Integrante: Diego
- Herramienta: Cursor (Composer)
- Objetivo: Crear la función `calculateFare` con comisión configurable y redondeo a 100 COP
- Prompt: (completo) implementación del proyecto UberClone Versión Conductor según PDF, incluyendo `calculateFare({ distanceKm, durationMin, category, tip })` que devuelva `{ fare, commission, driverEarnings }` con valores de `src/config/pricing.js` y el ejemplo 8,5 km / 22 min
- Resumen de la respuesta: Generó `pricing.js`, función pura con multiplicadores por categoría, comisión 20 % y redondeo; estructura Expo + Firebase/mock + pantallas del flujo conductor
- Qué se usó / modificó / descartó: Se usó la fórmula y estructura; se ajustó registro a tabs propias (sin nested navigator) para evitar remount; se mantuvo modo mock por defecto
- Archivos y commit: `src/utils/calculateFare.ts`, `src/config/pricing.js` — (pendiente de commit)
- Verificación: Ejemplo Económico 8,5 km / 22 min → 19.200 / comisión 3.840 / neto 15.360; XL → 26.900 / 5.380 / 21.520
- Aprendizaje: Centralizar tarifas en un solo archivo evita divergencia entre estimación y cierre

---

### Entrada #2
- Fecha: 2026-10-26
- Integrante: Diego
- Herramienta: Cursor (Composer)
- Objetivo: Scaffold completo app conductor (navegación, hooks, pagos Mercado Pago backend, historial, ganancias)
- Prompt: Debo realizar este proyecto por completo (PDF UberClone Versión Conductor)
- Resumen de la respuesta: Proyecto Expo TypeScript en Desktop, servicios mock/Firebase, drawer+stack, backend Express, README y esta bitácora
- Qué se usó / modificó / descartó: Flujo end-to-end en mock; FCM nativo diferido a Expo Notifications / build nativo (documentado en README)
- Archivos: app completa bajo `src/`, `backend/`, `docs/AI_LOG.md`
- Verificación: `npm start` + flujo registro → aprobar → disponible → simular solicitud → viaje → cobro
- Aprendizaje: Separar secretos en backend `.env` y nunca en la app

---

### Entrada #3
- Fecha: 2026-11-09
- Integrante: Diego
- Herramienta: Cursor (Composer)
- Objetivo: Rutas Medellín distintas (recogida ≠ destino), UI en español, cerrar checklist Firebase/Maps/Mercado Pago
- Prompt: Listo ahora vamos a actualizar rutas, que sean en medellin que siempre sean diferentes, eliminemos esos texto que indican paso a pasos, traducción toda la app debe de estar en español al igual que los errores de codigo, revisa bien ya que la ruta de llegar al pasajero es la misma hacia el desito y ahora que ya tenemos mercado pago, maps y fire base revisa el checklist y termine todo
- Resumen de la respuesta: Lugares de Medellín aleatorios; `pickupPolyline` y `routePolyline` separados; labels ES; notificaciones con expo-notifications; textos tutorial eliminados
- Qué se usó / modificó / descartó: Se usó Routes API al aceptar (conductor→origen) y al crear solicitud (origen→destino); FCM nativo queda para development build
- Archivos: `src/data/medellinPlaces.ts`, `src/screens/trip/ActiveTripScreen.tsx`, `src/services/tripService.ts`, `src/utils/labels.ts`, pantallas UI
- Verificación: Nueva solicitud → orígenes distintos en Medellín; viaje muestra tramos distintos hacia pasajero y destino
- Aprendizaje: No reutilizar la misma polyline partiendo a la mitad para ambos tramos

---

### Entrada #4
- Fecha: 2026-11-11
- Integrante: Diego
- Herramienta: Cursor (Composer)
- Objetivo: Cerrar gaps del PDF (date picker, cámara, perfil, rango fechas, webhook MP, tabs, Stripe prueba, FCM/Expo)
- Prompt: vamos con esto [lista de 9 ítems código/producto del checklist]
- Resumen de la respuesta: DateField + PhotoPicker; registro con createBottomTabNavigator; perfil editable; historial rango; worker webhook→Firestore; Stripe prueba; fcm.ts con fallback Expo
- Qué se usó / modificó / descartó: FCM nativo queda detrás de development build; Stripe sin PaymentSheet nativo (modo prueba vía worker)
- Archivos: `src/screens/register/*`, `ProfileScreen`, `HistoryScreen`, `PaymentSummaryScreen`, `backend/paymentWorker.js`
- Verificación: `npx tsc --noEmit`
- Aprendizaje: En Expo Go conviene notificaciones locales + webhook con ngrok para MP
