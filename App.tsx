import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { TamaguiProvider } from '@tamagui/core';
import { store } from './src/redux/store';
import { tamaguiConfig } from './src/tamagui.config';
import { initDatabase } from './src/services/database';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    // Initialize SQLite Database and seed tables
    initDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </TamaguiProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
