import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './moreTypes';
import { ReportsScreen } from '../screens';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}
