import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  error?: string;
};

export function SelectField({ label, value, options, onChange, error }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.chip, selected && styles.chipOn]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 13, color: '#334155', marginBottom: 6, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { color: '#334155', fontSize: 13 },
  chipTextOn: { color: '#fff' },
  error: { color: '#dc2626', fontSize: 12, marginTop: 4 },
});
