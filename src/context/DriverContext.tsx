import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { DriverProfile, Trip } from '../types';
import {
  loadCurrentDriver,
  loginDriver,
  logoutDriver,
  registerDriver,
  updateDriverAvailability,
  updateDriverProfile,
} from '../services/driverService';

type Ctx = {
  driver: DriverProfile | null;
  loading: boolean;
  activeTrip: Trip | null;
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  setActiveTrip: (trip: Trip | null) => void;
  refreshDriver: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: typeof registerDriver;
  logout: () => Promise<void>;
  setAvailable: (value: boolean) => Promise<void>;
  patchDriver: (patch: Partial<DriverProfile>) => Promise<void>;
};

const DriverContext = createContext<Ctx | null>(null);

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [language, setLanguageState] = useState<'es' | 'en'>('es');

  const refreshDriver = useCallback(async () => {
    const current = await loadCurrentDriver();
    setDriver(current);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const lang = await AsyncStorage.getItem('pref_language');
        if (lang === 'es' || lang === 'en') setLanguageState(lang);
        const lastAvail = await AsyncStorage.getItem('pref_available');
        const current = await loadCurrentDriver();
        if (current && lastAvail != null) {
          current.available = lastAvail === 'true';
        }
        setDriver(current);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lang: 'es' | 'en') => {
    setLanguageState(lang);
    await AsyncStorage.setItem('pref_language', lang);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const d = await loginDriver(email, password);
    setDriver(d);
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      profile: Parameters<typeof registerDriver>[2]
    ) => {
      const d = await registerDriver(email, password, profile);
      setDriver(d);
      return d;
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutDriver();
    setDriver(null);
    setActiveTrip(null);
  }, []);

  const setAvailable = useCallback(
    async (value: boolean) => {
      if (!driver) return;
      if (driver.approvalStatus !== 'approved' && value) {
        throw new Error('Cuenta pendiente de aprobación');
      }
      await updateDriverAvailability(driver.uid, value);
      await AsyncStorage.setItem('pref_available', String(value));
      setDriver({ ...driver, available: value });
    },
    [driver]
  );

  const patchDriver = useCallback(
    async (patch: Partial<DriverProfile>) => {
      if (!driver) return;
      const next = await updateDriverProfile(driver.uid, patch);
      if (next) setDriver(next);
    },
    [driver]
  );

  const value = useMemo(
    () => ({
      driver,
      loading,
      activeTrip,
      language,
      setLanguage,
      setActiveTrip,
      refreshDriver,
      login,
      register,
      logout,
      setAvailable,
      patchDriver,
    }),
    [
      driver,
      loading,
      activeTrip,
      language,
      setLanguage,
      refreshDriver,
      login,
      register,
      logout,
      setAvailable,
      patchDriver,
    ]
  );

  return (
    <DriverContext.Provider value={value}>{children}</DriverContext.Provider>
  );
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDriver dentro de DriverProvider');
  return ctx;
}
