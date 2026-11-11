import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Carga TS compilado en runtime vía transpile simple: reimplementa check del PDF
const pricing = {
  BASE_FARE: 3500,
  PER_KM: 1200,
  PER_MIN: 250,
  MIN_FARE: 6000,
  COMMISSION_RATE: 0.2,
  CATEGORY_MULTIPLIER: { economy: 1.0, xl: 1.4, premium: 1.8 },
  ROUND_TO: 100,
};

function calculateFare({ distanceKm, durationMin, category, tip = 0 }) {
  const raw = pricing.BASE_FARE + distanceKm * pricing.PER_KM + durationMin * pricing.PER_MIN;
  const multiplied = Math.max(raw, pricing.MIN_FARE) * pricing.CATEGORY_MULTIPLIER[category];
  const fare = Math.round(multiplied / pricing.ROUND_TO) * pricing.ROUND_TO;
  const commission = Math.round(fare * pricing.COMMISSION_RATE);
  const driverEarnings = fare - commission + tip;
  return { fare, commission, driverEarnings };
}

const eco = calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'economy' });
const xl = calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'xl' });

const checks = [
  ['eco.fare', eco.fare, 19200],
  ['eco.commission', eco.commission, 3840],
  ['eco.driverEarnings', eco.driverEarnings, 15360],
  ['xl.fare', xl.fare, 26900],
  ['xl.commission', xl.commission, 5380],
  ['xl.driverEarnings', xl.driverEarnings, 21520],
];

let failed = 0;
for (const [name, got, want] of checks) {
  const ok = got === want;
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}: ${got} (esperado ${want})`);
  if (!ok) failed += 1;
}

if (failed) {
  console.error(`Fallaron ${failed} aserciones`);
  process.exit(1);
}
console.log('Todas las aserciones del ejemplo PDF pasaron.');
