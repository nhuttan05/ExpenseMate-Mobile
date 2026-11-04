import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeScreen } from '../pages/HomeScreen';
import { TransactionsScreen } from '../pages/TransactionsScreen';
import { BudgetScreen } from '../pages/BudgetScreen';
import { ProfileScreen } from '../pages/ProfileScreen';
import { Colors, Shadows, Spacing, BorderRadius } from '../constants/theme';

const Tab = createBottomTabNavigator();

// Empty component for the center Add tab, because it's triggered via custom button to open modal
const NullScreen = () => null;

export const TabNavigator = ({ navigation }: any) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Giao dịch',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt-long" size={24} color={color} />
          ),
        }}
      />

      {/* Floating Center Add Button */}
      <Tab.Screen
        name="AddPlaceholder"
        component={NullScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: () => (
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                style={[styles.floatingButton, Shadows.floating]}
                onPress={() => navigation.navigate('AddTransaction')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="add" size={30} color={Colors.textWhite} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="BudgetTab"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Ngân sách',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="pie-chart" size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 84 : 68,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#EEF0F7',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  floatingButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
