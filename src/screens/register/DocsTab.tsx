import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DateField } from '../../components/DateField';
import { Field } from '../../components/Field';
import { FormScroll } from '../../components/FormScroll';
import { PhotoPickerField } from '../../components/PhotoPickerField';
import { COMMISSION_RATE } from '../../utils/calculateFare';
import { useRegisterForm } from './RegisterFormContext';

type Props = { onSubmit: () => void };

export function DocsTab({ onSubmit }: Props) {
  const {
    docs,
    setDocs,
    docsErrors,
    canSubmit,
    busy,
    submitError,
  } = useRegisterForm();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <FormScroll>
      <Field
        label="Licencia (número)"
        value={docs.licenseNumber}
        onChangeText={(licenseNumber) =>
          setDocs((d) => ({ ...d, licenseNumber }))
        }
      />
      <DateField
        label="Vencimiento licencia"
        value={docs.licenseExpiry}
        onChange={(licenseExpiry) => setDocs((d) => ({ ...d, licenseExpiry }))}
        error={docs.licenseExpiry ? docsErrors.licenseExpiry : undefined}
        minimumDate={tomorrow}
      />
      <PhotoPickerField
        label="Foto licencia"
        uri={docs.licensePhotoUri || undefined}
        onChange={(licensePhotoUri) => setDocs((d) => ({ ...d, licensePhotoUri }))}
        error={!docs.licensePhotoUri ? docsErrors.licensePhotoUri : undefined}
      />
      <DateField
        label="Vencimiento SOAT"
        value={docs.soatExpiry}
        onChange={(soatExpiry) => setDocs((d) => ({ ...d, soatExpiry }))}
        error={docs.soatExpiry ? docsErrors.soatExpiry : undefined}
        minimumDate={tomorrow}
      />
      <PhotoPickerField
        label="Foto SOAT"
        uri={docs.soatPhotoUri || undefined}
        onChange={(soatPhotoUri) => setDocs((d) => ({ ...d, soatPhotoUri }))}
        error={!docs.soatPhotoUri ? docsErrors.soatPhotoUri : undefined}
      />
      <DateField
        label="Vencimiento tecnomecánica (si aplica)"
        value={docs.technoExpiry}
        onChange={(technoExpiry) => setDocs((d) => ({ ...d, technoExpiry }))}
        error={docs.technoExpiry ? docsErrors.technoExpiry : undefined}
        minimumDate={tomorrow}
      />
      <PhotoPickerField
        label="Foto tecnomecánica"
        uri={docs.technoPhotoUri || undefined}
        onChange={(technoPhotoUri) => setDocs((d) => ({ ...d, technoPhotoUri }))}
        error={docsErrors.technoPhotoUri}
      />
      <Field
        label="Correo Mercado Pago"
        value={docs.mercadoPagoEmail}
        onChangeText={(mercadoPagoEmail) =>
          setDocs((d) => ({ ...d, mercadoPagoEmail }))
        }
        keyboardType="email-address"
        autoCapitalize="none"
        error={
          docs.mercadoPagoEmail ? docsErrors.mercadoPagoEmail : undefined
        }
      />
      <Pressable
        style={styles.checkRow}
        onPress={() =>
          setDocs((d) => ({ ...d, termsAccepted: !d.termsAccepted }))
        }
      >
        <View style={[styles.check, docs.termsAccepted && styles.checkOn]} />
        <Text style={styles.checkText}>
          Acepto términos. Comisión plataforma:{' '}
          {Math.round(COMMISSION_RATE * 100)}%
        </Text>
      </Pressable>
      {docsErrors.termsAccepted ? (
        <Text style={styles.err}>{docsErrors.termsAccepted}</Text>
      ) : null}
      {submitError ? <Text style={styles.err}>{submitError}</Text> : null}
      <Pressable
        style={[styles.submit, !canSubmit && styles.submitOff]}
        disabled={!canSubmit}
        onPress={onSubmit}
      >
        <Text style={styles.submitText}>
          {busy ? 'Enviando…' : 'Enviar registro'}
        </Text>
      </Pressable>
    </FormScroll>
  );
}

const styles = StyleSheet.create({
  err: { color: '#dc2626', marginBottom: 8, fontSize: 12 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  check: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#64748b',
    borderRadius: 4,
  },
  checkOn: { backgroundColor: '#0f172a' },
  checkText: { flex: 1, color: '#334155' },
  submit: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitOff: { opacity: 0.4 },
  submitText: { color: '#fff', fontWeight: '700' },
});
