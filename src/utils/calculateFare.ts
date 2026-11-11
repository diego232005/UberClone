// AI-assisted: see docs/AI_LOG.md #1
import pricing from '../config/pricing';
import type { FareResult, VehicleCategory } from '../types';

type Input = {
  distanceKm: number;
  durationMin: number;
  category: VehicleCategory;
  tip?: number;
  commissionRate?: number;
};

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Función pura compartida por estimación y cierre de viaje.
 * Orden (PDF §5): base+km+min → mínimo → multiplicador categoría → redondeo 100 → comisión.
 */
export function calculateFare({
  distanceKm,
  durationMin,
  category,
  tip = 0,
  commissionRate = pricing.COMMISSION_RATE,
}: Input): FareResult {
  const raw =
    pricing.BASE_FARE +
    distanceKm * pricing.PER_KM +
    durationMin * pricing.PER_MIN;
  const withMin = Math.max(raw, pricing.MIN_FARE);
  const multiplied =
    withMin * (pricing.CATEGORY_MULTIPLIER[category] ?? 1);
  const fare = roundToNearest(multiplied, pricing.ROUND_TO);
  const commission = Math.round(fare * commissionRate);
  const driverEarnings = fare - commission + Math.round(tip);
  return { fare, commission, driverEarnings };
}

export const COMMISSION_RATE = pricing.COMMISSION_RATE;

export default calculateFare;
