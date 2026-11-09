import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeScreen } from '../pages/HomeScreen';
import { WalletsScreen } from '../pages/WalletsScreen';
import { WhatIfSimulatorScreen } from '../pages/WhatIfSimulatorScreen';
import { ProfileScreen } from '../pages/ProfileScreen';
import { AdminScreen } from '../pages/AdminScreen';
import { Colors, Shadows } from '../constants/theme';
import { useAppSelector } from '../redux/store';

const Tab = createBottomTabNavigator();

// Empty component for the center Add tab, because it's triggered via custom button to open modal
const NullScreen = () => null;

export const TabNavigator = ({ navigation }: any) => {
  const { currentUser } = useAppSelector((state) => state.auth);

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
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="grid-view" size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="WalletsTab"
        component={WalletsScreen}
        options={{
          tabBarLabel: 'Ví ảo',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-balance-wallet" size={24} color={color} />
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
        name="SimulatorTab"
        component={WhatIfSimulatorScreen}
        options={{
          tabBarLabel: 'What-If AI',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="auto-fix-high" size={24} color={color} />
          ),
        }}
      />

      {/* Tab Quản Trị Hệ Thống: CHỈ HIỂN THỊ KHI ROLE LÀ ADMIN */}
      {currentUser?.role === 'ADMIN' && (
        <Tab.Screen
          name="AdminTab"
          component={AdminScreen}
          options={{
            tabBarLabel: 'Quản trị',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="admin-panel-settings" size={24} color={color} />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color }) => (
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
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
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
    fontWeight: '700',
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
