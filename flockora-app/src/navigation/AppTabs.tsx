import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TodayScreen } from '../screens/TodayScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { CameraSheetScreen } from '../screens/CameraSheetScreen';
import { FlockStack } from './FlockStack';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.leafGreen,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          height: 86,
          paddingTop: 8,
          paddingBottom: 16,
          borderTopColor: colors.border,
          backgroundColor: colors.cardSurface,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            Today: 'sunny',
            Flock: 'leaf',
            'Camera/Add': 'camera',
            Pulse: 'pulse',
            More: 'menu',
          };
          return <Ionicons name={iconMap[route.name] ?? 'help-circle'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Flock" component={FlockStack} />
      <Tab.Screen
        name="Camera/Add"
        component={CameraSheetScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size + 10} color={color} />,
          tabBarLabel: '',
        }}
      />
      <Tab.Screen name="Pulse" component={() => <PlaceholderScreen title="Pulse" />} />
      <Tab.Screen name="More" component={() => <PlaceholderScreen title="More" />} />
    </Tab.Navigator>
  );
}
