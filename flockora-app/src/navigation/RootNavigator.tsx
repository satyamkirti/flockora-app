import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { AppTabs } from './AppTabs';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';
import { OnboardingProvider } from '../context/OnboardingContext';
import { handleNotificationResponse } from '../services/notificationNavigation';
import {
  WelcomeScreen,
  BirdTypeSelectionScreen,
  PurposeSelectionScreen,
  AddFirstBirdScreen,
  AIPhotoAnalysisLoadingScreen,
  ReviewConfirmBirdDetailsScreen,
  PersonalizedDashboardScreen,
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  useEffect(() => {
    // Cold start: app was launched by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    // Warm/background: app was already running when the notification was tapped.
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, []);

  return (
    <OnboardingProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="BirdTypeSelection" component={BirdTypeSelectionScreen} />
          <Stack.Screen name="PurposeSelection" component={PurposeSelectionScreen} />
          <Stack.Screen name="AddFirstBird" component={AddFirstBirdScreen} />
          <Stack.Screen
            name="AIPhotoAnalysisLoading"
            component={AIPhotoAnalysisLoadingScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="ReviewConfirmBirdDetails" component={ReviewConfirmBirdDetailsScreen} />
          <Stack.Screen
            name="PersonalizedDashboard"
            component={PersonalizedDashboardScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="Main" component={AppTabs} options={{ gestureEnabled: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </OnboardingProvider>
  );
}
