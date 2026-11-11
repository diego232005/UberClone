import React from 'react';
import { FormScroll } from '../../components/FormScroll';
import { DateField } from '../../components/DateField';
import { Field } from '../../components/Field';
import { PhotoPickerField } from '../../components/PhotoPickerField';
import { SelectField } from '../../components/SelectField';
import { useRegisterForm } from './RegisterFormContext';

export function PersonalTab() {
  const { personal, setPersonal, personalErrors } = useRegisterForm();

  return (
    <FormScroll>
      <PhotoPickerField
        label="Foto de perfil"
        uri={personal.photoUri || undefined}
        onChange={(photoUri) => setPersonal((p) => ({ ...p, photoUri }))}
        error={!personal.photoUri ? personalErrors.photoUri : undefined}
      />
      <Field
        label="Nombre completo"
        value={personal.fullName}
        onChangeText={(fullName) => setPersonal((p) => ({ ...p, fullName }))}
        error={personal.fullName ? personalErrors.fullName : undefined}
        maxLength={50}
      />
      <Field
        label="Documento"
        value={personal.documentId}
        onChangeText={(documentId) =>
          setPersonal((p) => ({ ...p, documentId: documentId.replace(/\D/g, '') }))
        }
        keyboardType="numeric"
        error={personal.documentId ? personalErrors.documentId : undefined}
        maxLength={10}
      />
      <Field
        label="Celular"
        value={personal.phone}
        onChangeText={(phone) =>
          setPersonal((p) => ({ ...p, phone: phone.replace(/\D/g, '') }))
        }
        keyboardType="phone-pad"
        error={personal.phone ? personalErrors.phone : undefined}
        maxLength={10}
      />
      <DateField
        label="Fecha de nacimiento"
        value={personal.birthDate}
        onChange={(birthDate) => setPersonal((p) => ({ ...p, birthDate }))}
        error={personal.birthDate ? personalErrors.birthDate : undefined}
        maximumDate={new Date()}
      />
      <SelectField
        label="Género"
        value={personal.gender}
        onChange={(gender) => setPersonal((p) => ({ ...p, gender }))}
        options={[
          { label: 'Masculino', value: 'male' },
          { label: 'Femenino', value: 'female' },
          { label: 'Otro', value: 'other' },
        ]}
      />
      <Field
        label="Correo"
        value={personal.email}
        onChangeText={(email) => setPersonal((p) => ({ ...p, email }))}
        keyboardType="email-address"
        autoCapitalize="none"
        error={personal.email ? personalErrors.email : undefined}
      />
      <Field
        label="Contraseña (mín. 6)"
        value={personal.password}
        onChangeText={(password) => setPersonal((p) => ({ ...p, password }))}
        secureTextEntry
        autoCapitalize="none"
      />
      <SelectField
        label="Idioma"
        value={personal.language}
        onChange={(language) =>
          setPersonal((p) => ({ ...p, language: language as 'es' | 'en' }))
        }
        options={[
          { label: 'Español', value: 'es' },
          { label: 'Inglés', value: 'en' },
        ]}
      />
    </FormScroll>
  );
}
