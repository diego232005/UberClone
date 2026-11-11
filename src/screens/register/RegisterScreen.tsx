// AI-assisted: see docs/AI_LOG.md #4
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useCallback } from 'react';
import { Text } from 'react-native';
import { useDriver } from '../../context/DriverContext';
import { uploadImage } from '../../services/cloudinary';
import type { VehicleCategory } from '../../types';
import { DocsTab } from './DocsTab';
import { PersonalTab } from './PersonalTab';
import {
  RegisterFormProvider,
  useRegisterForm,
} from './RegisterFormContext';
import { VehicleTab } from './VehicleTab';

const Tab = createBottomTabNavigator();

function RegisterTabs({ navigation }: { navigation: any }) {
  const { register } = useDriver();
  const {
    personal,
    vehicle,
    docs,
    canSubmit,
    setBusy,
    setSubmitError,
  } = useRegisterForm();

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setBusy(true);
    setSubmitError('');
    try {
      const photoUrl = await uploadImage(personal.photoUri, 'drivers/profile');
      const vehiclePhotoUrl = await uploadImage(
        vehicle.photoUri,
        'drivers/vehicle'
      );
      const licensePhotoUrl = await uploadImage(
        docs.licensePhotoUri,
        'drivers/docs'
      );
      const soatPhotoUrl = await uploadImage(docs.soatPhotoUri, 'drivers/docs');
      const technoPhotoUrl = docs.technoPhotoUri
        ? await uploadImage(docs.technoPhotoUri, 'drivers/docs')
        : undefined;

      await register(personal.email.trim(), personal.password, {
        fullName: personal.fullName.trim(),
        documentId: personal.documentId,
        phone: personal.phone,
        birthDate: personal.birthDate,
        gender: personal.gender,
        language: personal.language,
        photoUrl,
        vehicle: {
          category: vehicle.category as VehicleCategory,
          plate: vehicle.plate.toUpperCase().replace(/\s/g, ''),
          brand: vehicle.brand.trim(),
          model: vehicle.model.trim(),
          year: Number(vehicle.year),
          color: vehicle.color,
          capacity: Number(vehicle.capacity),
          photoUrl: vehiclePhotoUrl,
        },
        documents: {
          licenseNumber: docs.licenseNumber,
          licensePhotoUrl,
          licenseExpiry: docs.licenseExpiry,
          soatPhotoUrl,
          soatExpiry: docs.soatExpiry,
          technoPhotoUrl,
          technoExpiry: docs.technoExpiry || undefined,
        },
        mercadoPagoEmail: docs.mercadoPagoEmail,
        approvalStatus: 'pending',
      });
      navigation.goBack();
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Error al registrar');
    } finally {
      setBusy(false);
    }
  }, [
    canSubmit,
    personal,
    vehicle,
    docs,
    register,
    navigation,
    setBusy,
    setSubmitError,
  ]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen
        name="Datos"
        component={PersonalTab}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12, fontWeight: '700' }}>Datos</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Vehiculo"
        component={VehicleTab}
        options={{
          title: 'Vehículo',
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12, fontWeight: '700' }}>
              Vehículo
            </Text>
          ),
        }}
      />
      <Tab.Screen name="Documentos" options={{ title: 'Documentos' }}>
        {() => <DocsTab onSubmit={onSubmit} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function RegisterScreen({ navigation }: any) {
  return (
    <RegisterFormProvider>
      <RegisterTabs navigation={navigation} />
    </RegisterFormProvider>
  );
}
