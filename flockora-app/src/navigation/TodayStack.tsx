import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TodayStackParamList } from './todayTypes';
import { TodayScreen, TaskDetailScreen, AddEditTaskScreen } from '../screens';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export function TodayStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TodayHome" component={TodayScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="AddEditTask" component={AddEditTaskScreen} />
    </Stack.Navigator>
  );
}
