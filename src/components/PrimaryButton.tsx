import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
  style?: ViewStyle;
};

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: Props) {
  const bg =
    variant === 'danger'
      ? colors.danger
      : variant === 'ghost'
        ? 'transparent'
        : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  ghost: { borderWidth: 1, borderColor: colors.border },
  text: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
