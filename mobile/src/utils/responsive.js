import { useWindowDimensions } from "react-native";

export const BREAKPOINTS = {
  smallPhone: 360,
  tablet: 600,
  desktop: 900,
};

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < BREAKPOINTS.smallPhone;
  const isPhone = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isWide = width >= BREAKPOINTS.tablet;

  // Calculate dynamic grid columns for card lists
  let numColumns = 1;
  if (width >= 900) {
    numColumns = 3;
  } else if (width >= 600) {
    numColumns = 2;
  }

  // Max width container helper
  const maxContentWidth = isDesktop ? 960 : isTablet ? 720 : 540;

  // Responsive padding
  const paddingHorizontal = isSmallPhone ? 12 : isTablet ? 24 : 18;

  return {
    width,
    height,
    isSmallPhone,
    isPhone,
    isTablet,
    isDesktop,
    isWide,
    numColumns,
    maxContentWidth,
    paddingHorizontal,
  };
}

/**
 * Calculates a scaled font size based on screen width
 */
export function responsiveFontSize(width, baseSize) {
  if (width < 360) return Math.round(baseSize * 0.9);
  if (width >= 768) return Math.round(baseSize * 1.15);
  return baseSize;
}
