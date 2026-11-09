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
import { LoginScreen } from '../pages/LoginScreen';
import { RegisterScreen } from '../pages/RegisterScreen';
import { ForgotPasswordScreen } from '../pages/ForgotPasswordScreen';
import { EditTransactionScreen } from '../pages/EditTransactionScreen';
import { CategoriesScreen } from '../pages/CategoriesScreen';
import { StatisticsScreen } from '../pages/StatisticsScreen';
import { WalletsScreen } from '../pages/WalletsScreen';
import { RecurringScreen } from '../pages/RecurringScreen';
import { WhatIfSimulatorScreen } from '../pages/WhatIfSimulatorScreen';
import { AdminScreen } from '../pages/AdminScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="Wallets"
        component={WalletsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Recurring"
        component={RecurringScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WhatIfSimulator"
        component={WhatIfSimulatorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="EditTransaction"
        component={EditTransactionScreen}
        options={{ animation: 'slide_from_right' }}
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
        name="Budget"
        component={BudgetScreen}
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
        name="Categories"
        component={CategoriesScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ animation: 'slide_from_right' }}
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
