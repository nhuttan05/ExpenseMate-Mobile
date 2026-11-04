import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/theme';

interface AnimatedProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  color = Colors.primary,
  height = 8,
  style,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.min(Math.max(progress, 0), 100),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolation,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 9999,
  },
});
