import React, { createContext, useContext, useMemo, useState } from 'react';
import type { VehicleCategory } from '../../types';
import {
  validateDocuments,
  validatePersonal,
  validateVehicle,
} from '../../utils/validators';

export type PersonalForm = {
  photoUri: string;
  fullName: string;
  documentId: string;
  phone: string;
  birthDate: string;
  gender: string;
  email: string;
  password: string;
  language: 'es' | 'en';
};

export type VehicleForm = {
  category: VehicleCategory | '';
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  capacity: string;
  photoUri: string;
};

export type DocsForm = {
  licenseNumber: string;
  licensePhotoUri: string;
  licenseExpiry: string;
  soatPhotoUri: string;
  soatExpiry: string;
  technoPhotoUri: string;
  technoExpiry: string;
  mercadoPagoEmail: string;
  termsAccepted: boolean;
};

type Ctx = {
  personal: PersonalForm;
  setPersonal: React.Dispatch<React.SetStateAction<PersonalForm>>;
  vehicle: VehicleForm;
  setVehicle: React.Dispatch<React.SetStateAction<VehicleForm>>;
  docs: DocsForm;
  setDocs: React.Dispatch<React.SetStateAction<DocsForm>>;
  personalOk: boolean;
  vehicleOk: boolean;
  docsOk: boolean;
  personalErrors: Record<string, string>;
  vehicleErrors: Record<string, string>;
  docsErrors: Record<string, string>;
  canSubmit: boolean;
  busy: boolean;
  setBusy: (v: boolean) => void;
  submitError: string;
  setSubmitError: (v: string) => void;
};

const RegisterFormContext = createContext<Ctx | null>(null);

export function RegisterFormProvider({ children }: { children: React.ReactNode }) {
  const [personal, setPersonal] = useState<PersonalForm>({
    photoUri: '',
    fullName: '',
    documentId: '',
    phone: '',
    birthDate: '',
    gender: '',
    email: '',
    password: '',
    language: 'es',
  });
  const [vehicle, setVehicle] = useState<VehicleForm>({
    category: '',
    plate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    capacity: '',
    photoUri: '',
  });
  const [docs, setDocs] = useState<DocsForm>({
    licenseNumber: '',
    licensePhotoUri: '',
    licenseExpiry: '',
    soatPhotoUri: '',
    soatExpiry: '',
    technoPhotoUri: '',
    technoExpiry: '',
    mercadoPagoEmail: '',
    termsAccepted: false,
  });
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const personalErrors = useMemo(() => validatePersonal(personal), [personal]);
  const vehicleErrors = useMemo(
    () => validateVehicle({ ...vehicle, plate: vehicle.plate.toUpperCase() }),
    [vehicle]
  );
  const docsErrors = useMemo(
    () =>
      validateDocuments({
        ...docs,
        vehicleYear: Number(vehicle.year) || new Date().getFullYear(),
      }),
    [docs, vehicle.year]
  );

  const personalOk =
    Object.keys(personalErrors).length === 0 && personal.password.length >= 6;
  const vehicleOk = Object.keys(vehicleErrors).length === 0;
  const docsOk = Object.keys(docsErrors).length === 0;

  const value = useMemo(
    () => ({
      personal,
      setPersonal,
      vehicle,
      setVehicle,
      docs,
      setDocs,
      personalOk,
      vehicleOk,
      docsOk,
      personalErrors,
      vehicleErrors,
      docsErrors,
      canSubmit: personalOk && vehicleOk && docsOk && !busy,
      busy,
      setBusy,
      submitError,
      setSubmitError,
    }),
    [
      personal,
      vehicle,
      docs,
      personalOk,
      vehicleOk,
      docsOk,
      personalErrors,
      vehicleErrors,
      docsErrors,
      busy,
      submitError,
    ]
  );

  return (
    <RegisterFormContext.Provider value={value}>
      {children}
    </RegisterFormContext.Provider>
  );
}

export function useRegisterForm() {
  const ctx = useContext(RegisterFormContext);
  if (!ctx) throw new Error('useRegisterForm dentro de RegisterFormProvider');
  return ctx;
}
