import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

export function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: 12, marginTop: 4, marginBottom: 8 },
});
