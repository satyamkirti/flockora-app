import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppTabs } from './AppTabs';
import { RootStackParamList } from './types';
import { OnboardingProvider } from '../context/OnboardingContext';
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
  return (
    <OnboardingProvider>
      <NavigationContainer>
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
