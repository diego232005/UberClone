import type {
  ApprovalStatus,
  PaymentMethod,
  PaymentStatus,
  TripStatus,
  VehicleCategory,
} from '../types';

export function labelCategory(c: VehicleCategory | string): string {
  switch (c) {
    case 'economy':
      return 'Económico';
    case 'xl':
      return 'XL';
    case 'premium':
      return 'Premium';
    default:
      return String(c);
  }
}

export function labelPaymentMethod(m: PaymentMethod | string): string {
  switch (m) {
    case 'mercadopago':
      return 'Mercado Pago';
    case 'stripe':
      return 'Stripe';
    case 'cash':
      return 'Efectivo';
    default:
      return String(m);
  }
}

export function labelPaymentStatus(
  s?: PaymentStatus | TripStatus | string | null
): string {
  switch (s) {
    case 'approved':
    case 'paid':
      return 'Aprobado';
    case 'pending':
    case 'requested':
    case 'accepted':
    case 'driver_arriving':
    case 'in_progress':
    case 'completed':
      return 'Pendiente';
    case 'rejected':
    case 'cancelled':
      return 'Rechazado';
    case 'cash':
      return 'Efectivo';
    default:
      return s ? String(s) : 'Pendiente';
  }
}

export function labelApproval(s: ApprovalStatus | string): string {
  switch (s) {
    case 'approved':
      return 'Aprobado';
    case 'rejected':
      return 'Rechazado';
    case 'pending':
    default:
      return 'Pendiente';
  }
}
