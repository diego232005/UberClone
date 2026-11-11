import React from 'react';
import { FormScroll } from '../../components/FormScroll';
import { Field } from '../../components/Field';
import { PhotoPickerField } from '../../components/PhotoPickerField';
import { SelectField } from '../../components/SelectField';
import type { VehicleCategory } from '../../types';
import { useRegisterForm } from './RegisterFormContext';

export function VehicleTab() {
  const { vehicle, setVehicle, vehicleErrors } = useRegisterForm();

  return (
    <FormScroll>
      <SelectField
        label="Categoría"
        value={vehicle.category}
        onChange={(category) =>
          setVehicle((v) => ({ ...v, category: category as VehicleCategory }))
        }
        options={[
          { label: 'Económico', value: 'economy' },
          { label: 'XL', value: 'xl' },
          { label: 'Premium', value: 'premium' },
        ]}
      />
      <Field
        label="Placa"
        value={vehicle.plate}
        onChangeText={(plate) =>
          setVehicle((v) => ({ ...v, plate: plate.toUpperCase() }))
        }
        autoCapitalize="characters"
        maxLength={6}
        error={vehicle.plate ? vehicleErrors.plate : undefined}
      />
      <Field
        label="Marca"
        value={vehicle.brand}
        onChangeText={(brand) => setVehicle((v) => ({ ...v, brand }))}
        maxLength={30}
      />
      <Field
        label="Modelo"
        value={vehicle.model}
        onChangeText={(model) => setVehicle((v) => ({ ...v, model }))}
        maxLength={30}
      />
      <Field
        label="Año"
        value={vehicle.year}
        onChangeText={(year) =>
          setVehicle((v) => ({ ...v, year: year.replace(/\D/g, '') }))
        }
        keyboardType="numeric"
        maxLength={4}
        error={vehicle.year ? vehicleErrors.year : undefined}
      />
      <SelectField
        label="Color"
        value={vehicle.color}
        onChange={(color) => setVehicle((v) => ({ ...v, color }))}
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
        value={vehicle.capacity}
        onChangeText={(capacity) =>
          setVehicle((v) => ({ ...v, capacity: capacity.replace(/\D/g, '') }))
        }
        keyboardType="numeric"
        error={vehicle.capacity ? vehicleErrors.capacity : undefined}
      />
      <PhotoPickerField
        label="Foto del vehículo (con placa)"
        uri={vehicle.photoUri || undefined}
        onChange={(photoUri) => setVehicle((v) => ({ ...v, photoUri }))}
        error={!vehicle.photoUri ? vehicleErrors.photoUri : undefined}
      />
    </FormScroll>
  );
}
