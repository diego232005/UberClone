import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

type Props = ScrollViewProps & {
  children: React.ReactNode;
  /** Extra offset (p. ej. tab bar del registro). */
  extraOffset?: number;
};

/** Evita que el teclado tape los campos al final del formulario. */
export function FormScroll({
  children,
  extraOffset = 56,
  contentContainerStyle,
  ...rest
}: Props) {
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight + extraOffset}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.pad, contentContainerStyle]}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: 16, paddingBottom: 160 },
});
