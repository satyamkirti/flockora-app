import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FlockStackParamList } from './flockTypes';
import {
  FlockHomeScreen,
  BirdProfileScreen,
  AddEditBirdScreen,
  HealthRecordDetailScreen,
  AddEditHealthRecordScreen,
  EggDashboardScreen,
  AddEditEggRecordScreen,
  EggHistoryScreen,
  FeedInventoryScreen,
  AddEditFeedItemScreen,
  LogFeedUsageScreen,
  FeedHistoryScreen,
} from '../screens';

const Stack = createNativeStackNavigator<FlockStackParamList>();

export function FlockStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FlockHome" component={FlockHomeScreen} />
      <Stack.Screen name="BirdProfile" component={BirdProfileScreen} />
      <Stack.Screen name="AddEditBird" component={AddEditBirdScreen} />
      <Stack.Screen name="HealthRecordDetail" component={HealthRecordDetailScreen} />
      <Stack.Screen name="AddEditHealthRecord" component={AddEditHealthRecordScreen} />
      <Stack.Screen name="EggDashboard" component={EggDashboardScreen} />
      <Stack.Screen name="AddEditEggRecord" component={AddEditEggRecordScreen} />
      <Stack.Screen name="EggHistory" component={EggHistoryScreen} />
      <Stack.Screen name="FeedInventory" component={FeedInventoryScreen} />
      <Stack.Screen name="AddEditFeedItem" component={AddEditFeedItemScreen} />
      <Stack.Screen name="LogFeedUsage" component={LogFeedUsageScreen} />
      <Stack.Screen name="FeedHistory" component={FeedHistoryScreen} />
    </Stack.Navigator>
  );
}
