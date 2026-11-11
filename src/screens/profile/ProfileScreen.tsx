// AI-assisted: see docs/AI_LOG.md #4
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { DateField } from '../../components/DateField';
import { Field } from '../../components/Field';
import { PhotoPickerField } from '../../components/PhotoPickerField';
import { SelectField } from '../../components/SelectField';
import { useDriver } from '../../context/DriverContext';
import { uploadImage } from '../../services/cloudinary';
import { COMMISSION_RATE } from '../../utils/calculateFare';
import { labelApproval } from '../../utils/labels';
import type { VehicleCategory } from '../../types';

export function ProfileScreen() {
  const { driver, logout, patchDriver, language, setLanguage } = useDriver();
  const [photoUri, setPhotoUri] = useState(driver?.photoUrl ?? '');
  const [fullName, setFullName] = useState(driver?.fullName ?? '');
  const [phone, setPhone] = useState(driver?.phone ?? '');
  const [plate, setPlate] = useState(driver?.vehicle.plate ?? '');
  const [brand, setBrand] = useState(driver?.vehicle.brand ?? '');
  const [model, setModel] = useState(driver?.vehicle.model ?? '');
  const [year, setYear] = useState(String(driver?.vehicle.year ?? ''));
  const [color, setColor] = useState(driver?.vehicle.color ?? '');
  const [capacity, setCapacity] = useState(String(driver?.vehicle.capacity ?? ''));
  const [category, setCategory] = useState<VehicleCategory>(
    driver?.vehicle.category ?? 'economy'
  );
  const [vehiclePhotoUri, setVehiclePhotoUri] = useState(
    driver?.vehicle.photoUrl ?? ''
  );
  const [licenseNumber, setLicenseNumber] = useState(
    driver?.documents.licenseNumber ?? ''
  );
  const [licenseExpiry, setLicenseExpiry] = useState(
    driver?.documents.licenseExpiry ?? ''
  );
  const [soatExpiry, setSoatExpiry] = useState(
    driver?.documents.soatExpiry ?? ''
  );
  const [technoExpiry, setTechnoExpiry] = useState(
    driver?.documents.technoExpiry ?? ''
  );
  const [licensePhotoUri, setLicensePhotoUri] = useState(
    driver?.documents.licensePhotoUrl ?? ''
  );
  const [soatPhotoUri, setSoatPhotoUri] = useState(
    driver?.documents.soatPhotoUrl ?? ''
  );
  const [technoPhotoUri, setTechnoPhotoUri] = useState(
    driver?.documents.technoPhotoUrl ?? ''
  );
  const [mercadoPagoEmail, setMercadoPagoEmail] = useState(
    driver?.mercadoPagoEmail ?? ''
  );
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (!driver) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  async function save() {
    setBusy(true);
    setMsg('');
    try {
      const photoUrl =
        photoUri && !photoUri.startsWith('http')
          ? await uploadImage(photoUri, 'drivers/profile')
          : photoUri || driver!.photoUrl;
      const vehiclePhotoUrl = vehiclePhotoUri.startsWith('http')
        ? vehiclePhotoUri
        : await uploadImage(vehiclePhotoUri, 'drivers/vehicle');
      const licensePhotoUrl = licensePhotoUri.startsWith('http')
        ? licensePhotoUri
        : await uploadImage(licensePhotoUri, 'drivers/docs');
      const soatPhotoUrl = soatPhotoUri.startsWith('http')
        ? soatPhotoUri
        : await uploadImage(soatPhotoUri, 'drivers/docs');
      const technoPhotoUrl = technoPhotoUri
        ? technoPhotoUri.startsWith('http')
          ? technoPhotoUri
          : await uploadImage(technoPhotoUri, 'drivers/docs')
        : undefined;

      await patchDriver({
        photoUrl,
        fullName,
        phone,
        language,
        mercadoPagoEmail,
        vehicle: {
          ...driver!.vehicle,
          category,
          plate: plate.toUpperCase().replace(/\s/g, ''),
          brand,
          model,
          year: Number(year) || driver!.vehicle.year,
          color,
          capacity: Number(capacity) || driver!.vehicle.capacity,
          photoUrl: vehiclePhotoUrl,
        },
        documents: {
          licenseNumber,
          licensePhotoUrl,
          licenseExpiry,
          soatPhotoUrl,
          soatExpiry,
          technoPhotoUrl,
          technoExpiry: technoExpiry || undefined,
        },
      });
      setMsg('Guardado');
    } catch (e: any) {
      setMsg(e?.message ?? 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.meta}>{driver.email}</Text>
      <Text style={styles.meta}>
        Aprobación: {labelApproval(driver.approvalStatus)} · Comisión{' '}
        {Math.round(COMMISSION_RATE * 100)}%
      </Text>

      <Text style={styles.section}>Datos personales</Text>
      <PhotoPickerField
        label="Foto de perfil"
        uri={photoUri || undefined}
        onChange={setPhotoUri}
      />
      <Field label="Nombre" value={fullName} onChangeText={setFullName} />
      <Field
        label="Celular"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <SelectField
        label="Idioma"
        value={language}
        onChange={(v) => setLanguage(v as 'es' | 'en')}
        options={[
          { label: 'Español', value: 'es' },
          { label: 'Inglés', value: 'en' },
        ]}
      />

      <Text style={styles.section}>Vehículo</Text>
      <SelectField
        label="Categoría"
        value={category}
        onChange={(v) => setCategory(v as VehicleCategory)}
        options={[
          { label: 'Económico', value: 'economy' },
          { label: 'XL', value: 'xl' },
          { label: 'Premium', value: 'premium' },
        ]}
      />
      <Field
        label="Placa"
        value={plate}
        onChangeText={(t) => setPlate(t.toUpperCase())}
        autoCapitalize="characters"
        maxLength={6}
      />
      <Field label="Marca" value={brand} onChangeText={setBrand} maxLength={30} />
      <Field label="Modelo" value={model} onChangeText={setModel} maxLength={30} />
      <Field
        label="Año"
        value={year}
        onChangeText={(t) => setYear(t.replace(/\D/g, ''))}
        keyboardType="numeric"
        maxLength={4}
      />
      <SelectField
        label="Color"
        value={color}
        onChange={setColor}
        options={[
          { label: 'Blanco', value: 'white' },
          { label: 'Negro', value: 'black' },
          { label: 'Gris', value: 'gray' },
          { label: 'Rojo', value: 'red' },
          { label: 'Azul', value: 'blue' },
        ]}
      />
      <Field
        label="Capacidad"
        value={capacity}
        onChangeText={(t) => setCapacity(t.replace(/\D/g, ''))}
        keyboardType="numeric"
      />
      <PhotoPickerField
        label="Foto del vehículo"
        uri={vehiclePhotoUri || undefined}
        onChange={setVehiclePhotoUri}
      />

      <Text style={styles.section}>Documentos y pagos</Text>
      <Field
        label="Licencia (número)"
        value={licenseNumber}
        onChangeText={setLicenseNumber}
      />
      <DateField
        label="Vencimiento licencia"
        value={licenseExpiry}
        onChange={setLicenseExpiry}
        minimumDate={tomorrow}
      />
      <PhotoPickerField
        label="Foto licencia"
        uri={licensePhotoUri || undefined}
        onChange={setLicensePhotoUri}
      />
      <DateField
        label="Vencimiento SOAT"
        value={soatExpiry}
        onChange={setSoatExpiry}
        minimumDate={tomorrow}
      />
      <PhotoPickerField
        label="Foto SOAT"
        uri={soatPhotoUri || undefined}
        onChange={setSoatPhotoUri}
      />
      <DateField
        label="Vencimiento tecnomecánica"
        value={technoExpiry}
        onChange={setTechnoExpiry}
        minimumDate={tomorrow}
      />
      <PhotoPickerField
        label="Foto tecnomecánica"
        uri={technoPhotoUri || undefined}
        onChange={setTechnoPhotoUri}
      />
      <Field
        label="Correo Mercado Pago"
        value={mercadoPagoEmail}
        onChangeText={setMercadoPagoEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Pressable style={styles.btn} onPress={save} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Guardando…' : 'Guardar'}</Text>
      </Pressable>
      {msg ? <Text style={styles.ok}>{msg}</Text> : null}
      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 8, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800' },
  section: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  meta: { color: '#64748b' },
  btn: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  ok: { color: '#15803d' },
  logout: {
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  logoutText: { color: '#b91c1c', fontWeight: '700' },
});
