import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { scale, fontScale } from '../utils/responsive';

interface InputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ icon, error, style, ...props }) => {
  return (
    <View style={[styles.container, error && styles.error]}>
      {icon && (
        <Ionicons 
          name={icon} 
          size={scale(20)} 
          color={colors.textMuted} 
          style={styles.icon} 
        />
      )}
      <TextInput
        style={[styles.input, icon && styles.inputWithIcon, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  error: {
    borderColor: colors.error,
  },
  icon: {
    paddingLeft: scale(16),
  },
  input: {
    flex: 1,
    height: scale(52),
    paddingHorizontal: scale(16),
    color: colors.textPrimary,
    fontSize: fontScale(16),
  },
  inputWithIcon: {
    paddingLeft: scale(8),
  },
});
