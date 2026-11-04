import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatBadgeProps {
  label: string;
  backgroundColor: string;
  textColor: string;
}

export const StatBadge: React.FC<StatBadgeProps> = ({ label, backgroundColor, textColor }) => {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
