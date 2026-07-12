import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { colors, typography } from '../theme';

type AppTextProps = TextProps & {
  variant?: keyof typeof typography;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center';
};

export function AppText({
  variant = 'body',
  color = colors.primaryText,
  align = 'left',
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        styles.base,
        typography[variant],
        { color, textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.primaryText,
  },
});
