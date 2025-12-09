// Cores do tema UEMA Digital
export const colors = {
  // Cores primárias
  primary: '#3c8dbc',
  primaryDark: '#357ca5',
  primaryLight: '#5a9fd4',
  
  // Background
  background: '#222d32',
  backgroundLight: '#2c3b41',
  backgroundDark: '#1a2226',
  surface: '#ecf0f5',
  
  // Status
  success: '#00a65a',
  warning: '#f39c12',
  error: '#dd4b39',
  info: '#00c0ef',
  
  // Texto
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textDark: '#333333',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.2)',
  
  // Gradients (como strings para uso direto)
  gradientBlue: ['#3c8dbc', '#2a6f94'],
  gradientPurple: ['#8e44ad', '#6c3483'],
  gradientGreen: ['#00a65a', '#008d4c'],
  gradientOrange: ['#f39c12', '#d68910'],
};

// Tipografia
export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};

// Espaçamentos
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows (para iOS)
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
