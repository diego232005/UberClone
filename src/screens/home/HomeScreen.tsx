import React, { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useDriver } from '../../context/DriverContext';
import { useDriverLocation } from '../../hooks/useDriverLocation';
import { useTripRequests } from '../../hooks/useTripRequests';
import { MEDELLIN_CENTER } from '../../data/medellinPlaces';
import { formatCop } from '../../utils/format';
import { IncomingRequestModal } from '../trip/IncomingRequestModal';

export function HomeScreen({ navigation }: any) {
  const { driver, setAvailable, setActiveTrip, patchDriver } = useDriver();
  const available = !!driver?.available;
  const { location } = useDriverLocation(driver?.uid, available);
  const { incoming, accept, reject, simulate } = useTripRequests(
    driver?.uid,
    available
  );
  const [availError, setAvailError] = useState('');

  const onToggle = useCallback(
    async (value: boolean) => {
      setAvailError('');
      try {
        await setAvailable(value);
      } catch (err: any) {
        setAvailError(err?.message ?? 'No disponible');
      }
    },
    [setAvailable]
  );

  async function onAccept() {
    const trip = await accept(location ?? driver?.location);
    if (trip) {
      setActiveTrip(trip);
      navigation.navigate('ActiveTrip');
    }
  }

  async function approveSelf() {
    await patchDriver({ approvalStatus: 'approved' });
  }

  const coord = location ?? driver?.location ?? MEDELLIN_CENTER;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        region={{
          latitude: coord.lat,
          longitude: coord.lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        <Marker coordinate={{ latitude: coord.lat, longitude: coord.lng }} title="Tú" />
      </MapView>

      <View style={styles.panel}>
        <View style={styles.headerRow}>
          {driver?.photoUrl ? (
            <Image source={{ uri: driver.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {(driver?.fullName || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{driver?.fullName}</Text>
            <Text style={styles.meta}>
              Estado:{' '}
              {driver?.approvalStatus === 'approved'
                ? 'Aprobado'
                : 'Pendiente de aprobación'}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.toggleLabel}>
            {available ? 'Disponible' : 'No disponible'}
          </Text>
          <Switch value={available} onValueChange={onToggle} />
        </View>
        {availError ? <Text style={styles.err}>{availError}</Text> : null}
        {driver?.approvalStatus !== 'approved' ? (
          <Pressable style={styles.secondary} onPress={approveSelf}>
            <Text style={styles.secondaryText}>Aprobar cuenta</Text>
          </Pressable>
        ) : null}
        {available ? (
          <Pressable style={styles.secondary} onPress={simulate}>
            <Text style={styles.secondaryText}>Nueva solicitud</Text>
          </Pressable>
        ) : null}
      </View>

      <IncomingRequestModal
        trip={incoming}
        visible={!!incoming}
        onAccept={onAccept}
        onReject={reject}
        formatFare={formatCop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    elevation: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#e2e8f0' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  name: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  meta: { color: '#64748b' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 16, fontWeight: '600' },
  err: { color: '#dc2626' },
  secondary: {
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  secondaryText: { color: '#0f172a', fontWeight: '600' },
});
