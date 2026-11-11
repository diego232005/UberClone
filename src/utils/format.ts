export function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function categoryLabel(c: string): string {
  if (c === 'xl') return 'XL';
  if (c === 'premium') return 'Premium';
  return 'Económico';
}
