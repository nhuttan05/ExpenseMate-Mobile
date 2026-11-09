import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ViewStyle, StyleProp } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors, DarkColors } from '../../constants/theme';
import { useAppSelector } from '../../redux/store';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
}) => {
  const { contentMaxWidth, isTablet, isLandscape } = useResponsive();
  const isDarkMode = useAppSelector((state) => state.auth?.isDarkMode);
  const currentBg = isDarkMode ? DarkColors.background : Colors.background;

  const innerStyle: ViewStyle = {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    flex: 1,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentBg }, style]}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            (isTablet || isLandscape) && styles.tabletScrollPadding,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={innerStyle}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.innerFlex, innerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tabletScrollPadding: {
    paddingHorizontal: 24,
  },
  innerFlex: {
    flex: 1,
  },
});
