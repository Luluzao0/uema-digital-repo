import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// iPhone 13 Pro Max base dimensions (design base)
const BASE_WIDTH = 428;
const BASE_HEIGHT = 926;

// Responsive scaling functions
export const wp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

export const hp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};

// Scale based on width
export const scale = (size: number): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scaleFactor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Vertical scale based on height
export const verticalScale = (size: number): number => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scaleFactor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Moderate scale with factor (0.5 by default - less aggressive scaling)
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Font scaling
export const fontScale = (size: number): number => {
  const scaleFactor = Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.2);
  return Math.round(PixelRatio.roundToNearestPixel(size * scaleFactor));
};

// Get screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 768;

// Safe area helpers
export const getStatusBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    // iPhone X and later (with notch)
    if (SCREEN_HEIGHT >= 812) {
      return 47;
    }
    return 20;
  }
  return StatusBar.currentHeight || 0;
};

export const getBottomSpace = (): number => {
  if (Platform.OS === 'ios' && SCREEN_HEIGHT >= 812) {
    return 34;
  }
  return 0;
};

// Responsive spacing
export const responsiveSpacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

// Responsive font sizes
export const responsiveFontSizes = {
  xs: fontScale(10),
  sm: fontScale(12),
  md: fontScale(14),
  lg: fontScale(16),
  xl: fontScale(18),
  xxl: fontScale(20),
  h3: fontScale(20),
  h2: fontScale(24),
  h1: fontScale(28),
  hero: fontScale(36),
};

// Responsive border radius
export const responsiveBorderRadius = {
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(24),
  full: 9999,
};

// Grid helpers
export const getColumnWidth = (columns: number, gap: number = 16): number => {
  const totalGap = (columns - 1) * scale(gap);
  const paddingHorizontal = scale(16) * 2;
  return (SCREEN_WIDTH - totalGap - paddingHorizontal) / columns;
};

// Export all dimensions
export const dimensions = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  statusBarHeight: getStatusBarHeight(),
  bottomSpace: getBottomSpace(),
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
};
