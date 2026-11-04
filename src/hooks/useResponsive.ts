import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isSmallPhone: boolean;
  isWide: boolean;
  contentMaxWidth: number;
  numColumns: number;
  cardPadding: number;
}

export const useResponsive = (): ResponsiveInfo => {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600 || width >= 768;
  const isSmallPhone = width < 375;
  const isWide = width >= 600;

  // On iPad/Tablet or Landscape, center content and prevent over-stretching
  const contentMaxWidth = isTablet ? 860 : isLandscape ? 720 : width;

  // 1 column for standard phone portrait, 2 columns for tablet or landscape
  const numColumns = isTablet || isLandscape ? 2 : 1;

  const cardPadding = isTablet ? 24 : isSmallPhone ? 12 : 16;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isSmallPhone,
    isWide,
    contentMaxWidth,
    numColumns,
    cardPadding,
  };
};
