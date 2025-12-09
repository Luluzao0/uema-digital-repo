import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, shadows, typography } from '../theme';
import { scale, fontScale } from '../utils/responsive';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  gradient?: string[];
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  subtitle,
  gradient,
  onPress, 
  style 
}) => {
  const content = (
    <>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </>
  );

  if (gradient) {
    const Wrapper = onPress ? TouchableOpacity : View;
    return (
      <Wrapper onPress={onPress} activeOpacity={0.8} style={style}>
        <LinearGradient
          colors={gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, styles.gradientCard]}
        >
          {content}
        </LinearGradient>
      </Wrapper>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.8}
        style={[styles.card, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  gradientCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  header: {
    marginBottom: scale(8),
  },
  title: {
    fontSize: fontScale(20),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontScale(14),
    color: colors.textSecondary,
    marginTop: scale(2),
  },
});
