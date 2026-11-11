import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (isoDate: string) => void;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

function parseIso(value: string): Date {
  if (!value) return new Date(2000, 0, 1);
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Selector de fecha (PDF §2) — no TextInput libre. */
export function DateField({
  label,
  value,
  onChange,
  error,
  maximumDate,
  minimumDate,
}: Props) {
  const [open, setOpen] = useState(false);

  function onPick(_e: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (date) onChange(toIso(date));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.btn, error ? styles.btnErr : null]} onPress={() => setOpen(true)}>
        <Text style={value ? styles.value : styles.placeholder}>
          {value || 'Elegir fecha'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {open ? (
        <DateTimePicker
          value={parseIso(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPick}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      ) : null}
      {Platform.OS === 'ios' && open ? (
        <Pressable onPress={() => setOpen(false)} style={styles.done}>
          <Text style={styles.doneText}>Listo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  label: { color: '#64748b', marginBottom: 4, fontWeight: '600' },
  btn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
  },
  btnErr: { borderColor: '#dc2626' },
  value: { color: '#0f172a' },
  placeholder: { color: '#94a3b8' },
  error: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  done: { alignSelf: 'flex-end', paddingVertical: 6 },
  doneText: { color: '#2563eb', fontWeight: '700' },
});
