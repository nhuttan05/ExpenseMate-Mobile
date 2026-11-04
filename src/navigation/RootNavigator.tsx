import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { AddTransactionScreen } from '../pages/AddTransactionScreen';
import { TransactionDetailScreen } from '../pages/TransactionDetailScreen';
import { AIAssistantScreen } from '../pages/AIAssistantScreen';
import { NotificationsScreen } from '../pages/NotificationsScreen';
import { BudgetScreen } from '../pages/BudgetScreen';
import { TransactionsScreen } from '../pages/TransactionsScreen';
import { ProfileScreen } from '../pages/ProfileScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};
