export type VehicleCategory = 'economy' | 'xl' | 'premium';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'mercadopago' | 'stripe' | 'cash';
export type PaymentStatus = 'approved' | 'pending' | 'rejected' | 'cash';
export type TripStatus =
  | 'requested'
  | 'accepted'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'cancelled'
  | 'rejected';

export type LatLng = { lat: number; lng: number; address?: string };

export type DriverProfile = {
  uid: string;
  fullName: string;
  documentId: string;
  phone: string;
  birthDate: string;
  gender: string;
  email: string;
  language: 'es' | 'en';
  photoUrl: string;
  vehicle: {
    category: VehicleCategory;
    plate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    capacity: number;
    photoUrl: string;
  };
  documents: {
    licenseNumber: string;
    licensePhotoUrl: string;
    licenseExpiry: string;
    soatPhotoUrl: string;
    soatExpiry: string;
    technoPhotoUrl?: string;
    technoExpiry?: string;
  };
  mercadoPagoEmail: string;
  approvalStatus: ApprovalStatus;
  available: boolean;
  location?: LatLng;
  balance: number;
  createdAt: number;
};

export type Trip = {
  id: string;
  driverId?: string;
  passengerId: string;
  passengerName?: string;
  origin: LatLng;
  destination: LatLng;
  distanceKm: number;
  durationMin: number;
  category: VehicleCategory;
  fare: number;
  commission: number;
  tip: number;
  driverEarnings: number;
  commissionRate: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  status: TripStatus;
  rating?: number;
  createdAt: number;
  completedAt?: number;
  /** Ruta conductor → recogida */
  pickupPolyline?: LatLng[];
  /** Ruta recogida → destino */
  routePolyline?: LatLng[];
};

export type FareResult = {
  fare: number;
  commission: number;
  driverEarnings: number;
};
