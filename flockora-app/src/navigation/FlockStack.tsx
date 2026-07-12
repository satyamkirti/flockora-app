import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FlockStackParamList } from './flockTypes';
import { FlockHomeScreen, BirdProfileScreen, AddEditBirdScreen } from '../screens';

const Stack = createNativeStackNavigator<FlockStackParamList>();

export function FlockStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FlockHome" component={FlockHomeScreen} />
      <Stack.Screen name="BirdProfile" component={BirdProfileScreen} />
      <Stack.Screen name="AddEditBird" component={AddEditBirdScreen} />
    </Stack.Navigator>
  );
}
