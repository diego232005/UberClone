import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Field } from '../../components/Field';
import { useDriver } from '../../context/DriverContext';
export function LoginScreen({ navigation }: any) {
  const { login } = useDriver();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>UberClone</Text>
      <Text style={styles.sub}>Versión Conductor</Text>
      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={onSubmit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Entrar</Text>
        )}
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Crear cuenta de conductor</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  brand: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 16, color: '#64748b', marginBottom: 24 },
  btn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 16, textAlign: 'center', color: '#2563eb' },
  error: { color: '#dc2626', marginBottom: 8 },
});
