import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  label: string;
  uri?: string;
  onChange: (uri: string) => void;
  error?: string;
};

/** Cámara o galería (PDF §2). */
export async function pickFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });
  if (res.canceled) return null;
  return res.assets[0]?.uri ?? null;
}

export async function pickFromCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({
    quality: 0.7,
  });
  if (res.canceled) return null;
  return res.assets[0]?.uri ?? null;
}

export function PhotoPickerField({ label, uri, onChange, error }: Props) {
  const [menu, setMenu] = useState(false);

  async function choose(source: 'camera' | 'library') {
    setMenu(false);
    const next =
      source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (next) onChange(next);
  }

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.photoBtn} onPress={() => setMenu(true)}>
        {uri ? (
          <Image source={{ uri }} style={styles.photo} />
        ) : (
          <Text style={styles.placeholder}>{label}</Text>
        )}
      </Pressable>
      {uri ? <Text style={styles.ok}>{label} ✓</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={menu} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Agregar foto</Text>
            <Pressable style={styles.option} onPress={() => void choose('camera')}>
              <Text style={styles.optionText}>Tomar foto (cámara)</Text>
            </Pressable>
            <Pressable style={styles.option} onPress={() => void choose('library')}>
              <Text style={styles.optionText}>Elegir de galería</Text>
            </Pressable>
            <Pressable style={styles.cancel} onPress={() => setMenu(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  photoBtn: {
    height: 120,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  placeholder: { color: '#64748b' },
  ok: { color: '#15803d', fontSize: 12, marginTop: 4 },
  error: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 8,
  },
  sheetTitle: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  option: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  optionText: { fontWeight: '700', color: '#0f172a' },
  cancel: { padding: 12, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '600' },
});
