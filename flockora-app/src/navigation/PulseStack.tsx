import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PulseStackParamList } from './pulseTypes';
import { CareDashboardScreen, PulseHomeScreen } from '../screens';

const Stack = createNativeStackNavigator<PulseStackParamList>();

export function PulseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CareDashboard" component={CareDashboardScreen} />
      <Stack.Screen name="PulseHome" component={PulseHomeScreen} />
    </Stack.Navigator>
  );
}
