import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

interface AdaptiveGridProps {
  children: React.ReactNode;
  gap?: number;
  style?: ViewStyle;
}

export const AdaptiveGrid: React.FC<AdaptiveGridProps> = ({ children, gap = 16, style }) => {
  const { numColumns } = useResponsive();

  if (numColumns === 1) {
    return <View style={style}>{children}</View>;
  }

  // 2-column flex wrap
  return (
    <View style={[styles.gridRow, { gap }, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={[styles.gridColumn, { flexBasis: `calc(50% - ${gap / 2}px)` }]}>
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  gridColumn: {
    flexGrow: 1,
    minWidth: 260,
  },
});
