import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const sizeStyles: Record<string, { height: number; paddingHorizontal: number; fontSize: number }> = {
    small: { height: 36, paddingHorizontal: 12, fontSize: 14 },
    medium: { height: 48, paddingHorizontal: 20, fontSize: 16 },
    large: { height: 56, paddingHorizontal: 28, fontSize: 18 },
  };

  const { height, paddingHorizontal, fontSize } = sizeStyles[size];

  if (variant === 'primary') {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        disabled={disabled || loading}
        style={[styles.buttonBase, { opacity: disabled ? 0.6 : 1 }, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { height, paddingHorizontal }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {icon}
              <Text style={[styles.buttonText, { fontSize, marginLeft: icon ? 8 : 0 }]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, { bg: string; border: string; text: string }> = {
    secondary: { bg: 'rgba(255,255,255,0.1)', border: 'transparent', text: '#fff' },
    outline: { bg: 'transparent', border: colors.primary, text: colors.primary },
    danger: { bg: colors.error, border: 'transparent', text: '#fff' },
  };

  const { bg, border, text } = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.buttonBase,
        {
          backgroundColor: bg,
          borderWidth: border !== 'transparent' ? 1 : 0,
          borderColor: border,
          height,
          paddingHorizontal,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonText, { color: text, fontSize, marginLeft: icon ? 8 : 0 }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
