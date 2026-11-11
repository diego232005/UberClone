export type FieldErrors = Record<string, string>;

export function onlyLettersSpaces(value: string): boolean {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(value.trim());
}

export function validatePersonal(data: {
  photoUri?: string;
  fullName: string;
  documentId: string;
  phone: string;
  birthDate: string;
  gender: string;
  email: string;
  language: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (!data.photoUri) e.photoUri = 'Foto de perfil obligatoria';
  if (!data.fullName.trim()) e.fullName = 'Obligatorio';
  else if (data.fullName.length > 50) e.fullName = 'Máximo 50 caracteres';
  else if (!onlyLettersSpaces(data.fullName)) e.fullName = 'Solo letras y espacios';
  if (!/^\d{6,10}$/.test(data.documentId)) e.documentId = 'Entre 6 y 10 dígitos';
  if (!/^\d{10}$/.test(data.phone)) e.phone = 'Exactamente 10 dígitos';
  if (!data.birthDate) e.birthDate = 'Obligatorio';
  else {
    const age =
      (Date.now() - new Date(data.birthDate).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) e.birthDate = 'Debe ser mayor de 18 años';
  }
  if (!data.gender) e.gender = 'Obligatorio';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Correo inválido';
  if (!data.language) e.language = 'Obligatorio';
  return e;
}

export function validateVehicle(data: {
  category: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  capacity: string;
  photoUri?: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (!data.category) e.category = 'Obligatorio';
  const plate = data.plate.toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{3}\d{3}$/.test(plate)) e.plate = 'Formato colombiano ABC123';
  if (!data.brand.trim() || data.brand.length > 30) e.brand = 'Máximo 30 caracteres';
  if (!data.model.trim() || data.model.length > 30) e.model = 'Máximo 30 caracteres';
  const year = Number(data.year);
  const current = new Date().getFullYear();
  if (!/^\d{4}$/.test(data.year) || year > current) e.year = 'Año inválido';
  if (!data.color) e.color = 'Obligatorio';
  const capacity = Number(data.capacity);
  if (!capacity || capacity < 1) e.capacity = 'Obligatorio';
  else if (data.category === 'xl' && capacity < 6)
    e.capacity = 'XL exige mínimo 6 pasajeros';
  if (!data.photoUri) e.photoUri = 'Foto del vehículo obligatoria';
  return e;
}

export function validateDocuments(data: {
  licenseNumber: string;
  licensePhotoUri?: string;
  licenseExpiry: string;
  soatPhotoUri?: string;
  soatExpiry: string;
  technoPhotoUri?: string;
  technoExpiry: string;
  vehicleYear: number;
  mercadoPagoEmail: string;
  termsAccepted: boolean;
}): FieldErrors {
  const e: FieldErrors = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!data.licenseNumber.trim()) e.licenseNumber = 'Obligatorio';
  if (!data.licensePhotoUri) e.licensePhotoUri = 'Foto obligatoria';
  if (!data.licenseExpiry || new Date(data.licenseExpiry) <= today)
    e.licenseExpiry = 'Vencimiento debe ser posterior a hoy';
  if (!data.soatPhotoUri) e.soatPhotoUri = 'Foto obligatoria';
  if (!data.soatExpiry || new Date(data.soatExpiry) <= today)
    e.soatExpiry = 'Vencimiento debe ser posterior a hoy';
  const needsTechno = data.vehicleYear < new Date().getFullYear() - 1;
  if (needsTechno) {
    if (!data.technoPhotoUri) e.technoPhotoUri = 'Foto obligatoria';
    if (!data.technoExpiry || new Date(data.technoExpiry) <= today)
      e.technoExpiry = 'Vencimiento debe ser posterior a hoy';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.mercadoPagoEmail))
    e.mercadoPagoEmail = 'Correo inválido';
  if (!data.termsAccepted) e.termsAccepted = 'Debes aceptar los términos';
  return e;
}
