import React, { useContext } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { ThemeContext } from '../theme/ThemeContext';
import DesktopHeader from '../components/DesktopHeader';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function TabNavigator({ navigation }: any) {
  const { theme } = useContext(ThemeContext);
  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === 'web' && width >= 768;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: !isDesktop,
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarStyle: isDesktop
            ? { display: 'none' }
            : {
                backgroundColor: theme.background,
                borderTopColor: theme.border,
              },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === 'Home') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === 'Calendar') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'My Diary' }}
        />
        <Tab.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: 'Calendar' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'My Profile' }}
        />
      </Tab.Navigator>
    </View>
  );
}
