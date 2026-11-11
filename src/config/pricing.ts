/** Valores didácticos en pesos colombianos enteros (sección 5 del enunciado). */
export const pricing = {
  BASE_FARE: 3500,
  PER_KM: 1200,
  PER_MIN: 250,
  MIN_FARE: 6000,
  COMMISSION_RATE: 0.2,
  CATEGORY_MULTIPLIER: {
    economy: 1.0,
    xl: 1.4,
    premium: 1.8,
  } as Record<string, number>,
  ROUND_TO: 100,
};

export default pricing;
