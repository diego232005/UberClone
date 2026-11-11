import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, firebaseReady } from '../config/firebase';
import type { DriverProfile, LatLng } from '../types';
import {
  clearMockDriver,
  getMockDriver,
  saveMockDriver,
} from './mockStore';

export async function registerDriver(
  email: string,
  password: string,
  profile: Omit<DriverProfile, 'uid' | 'email' | 'createdAt' | 'balance' | 'available'>
): Promise<DriverProfile> {
  if (!firebaseReady || !auth || !db) {
    const driver: DriverProfile = {
      ...profile,
      uid: `mock_${Date.now()}`,
      email,
      available: false,
      balance: 0,
      createdAt: Date.now(),
      approvalStatus: 'pending',
    };
    await saveMockDriver(driver);
    return driver;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const driver: DriverProfile = {
      ...profile,
      uid: cred.user.uid,
      email,
      available: false,
      balance: 0,
      createdAt: Date.now(),
      approvalStatus: 'pending',
    };
    await setDoc(doc(db, 'drivers', cred.user.uid), driver);
    return driver;
  } catch (err: any) {
    throw new Error(authErrorEs(err, 'No se pudo registrar'));
  }
}

function authErrorEs(err: any, fallback: string) {
  const code = String(err?.code ?? '');
  if (code.includes('invalid-credential') || code.includes('wrong-password'))
    return 'Correo o contraseña incorrectos';
  if (code.includes('user-not-found')) return 'No existe una cuenta con ese correo';
  if (code.includes('email-already-in-use')) return 'Ese correo ya está registrado';
  if (code.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres';
  if (code.includes('invalid-email')) return 'Correo inválido';
  if (code.includes('too-many-requests')) return 'Demasiados intentos. Espera un momento';
  if (code.includes('network-request-failed')) return 'Sin conexión. Revisa tu internet';
  return err?.message ? String(err.message) : fallback;
}

export async function loginDriver(email: string, password: string) {
  if (!firebaseReady || !auth || !db) {
    const driver = await getMockDriver();
    if (!driver || driver.email !== email) {
      throw new Error('Registra un conductor primero');
    }
    return driver;
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'drivers', cred.user.uid));
    if (!snap.exists()) throw new Error('Perfil de conductor no encontrado');
    return snap.data() as DriverProfile;
  } catch (err: any) {
    throw new Error(authErrorEs(err, 'No se pudo iniciar sesión'));
  }
}

export async function logoutDriver() {
  if (!firebaseReady || !auth) {
    await clearMockDriver();
    return;
  }
  await signOut(auth);
}

export async function updateDriverAvailability(
  uid: string,
  available: boolean
) {
  if (!firebaseReady || !db) {
    const driver = await getMockDriver();
    if (!driver) return;
    driver.available = available;
    await saveMockDriver(driver);
    return driver;
  }
  await updateDoc(doc(db, 'drivers', uid), { available });
}

export async function updateDriverLocation(uid: string, location: LatLng) {
  if (!firebaseReady || !db) {
    const driver = await getMockDriver();
    if (!driver) return;
    driver.location = location;
    await saveMockDriver(driver);
    return;
  }
  await updateDoc(doc(db, 'drivers', uid), { location });
}

export async function updateDriverProfile(
  uid: string,
  patch: Partial<DriverProfile>
) {
  if (!firebaseReady || !db) {
    const driver = await getMockDriver();
    if (!driver) return null;
    const next = { ...driver, ...patch };
    await saveMockDriver(next);
    return next;
  }
  await updateDoc(doc(db, 'drivers', uid), patch);
  const snap = await getDoc(doc(db, 'drivers', uid));
  return snap.data() as DriverProfile;
}

export async function loadCurrentDriver(): Promise<DriverProfile | null> {
  if (!firebaseReady || !auth || !db) {
    return getMockDriver();
  }
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, 'drivers', user.uid));
  return snap.exists() ? (snap.data() as DriverProfile) : null;
}
