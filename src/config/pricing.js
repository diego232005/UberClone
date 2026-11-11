/** Valores didácticos en COP enteros — único archivo de tarifas. */
module.exports = {
  BASE_FARE: 3500,
  PER_KM: 1200,
  PER_MIN: 250,
  MIN_FARE: 6000,
  COMMISSION_RATE: 0.2,
  CATEGORY_MULTIPLIER: {
    economy: 1.0,
    xl: 1.4,
    premium: 1.8,
  },
  ROUND_TO: 100,
};
