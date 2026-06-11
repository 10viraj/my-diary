import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../theme/ThemeContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AddEntryScreen from '../screens/AddEntryScreen';
import EntryDetailsScreen from '../screens/EntryDetailsScreen';
import EditEntryScreen from '../screens/EditEntryScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator>
      {user ? (
        // Main App Flow
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={TabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="AddEntry" 
            component={AddEntryScreen} 
            options={{ 
              title: 'New Diary Entry',
              headerStyle: { backgroundColor: theme.primary },
              headerTintColor: '#fff',
            }} 
          />
          <Stack.Screen 
            name="EntryDetails" 
            component={EntryDetailsScreen} 
            options={{ 
              title: 'Entry Details',
              headerStyle: { backgroundColor: theme.primary },
              headerTintColor: '#fff',
            }} 
          />
          <Stack.Screen 
            name="EditEntry" 
            component={EditEntryScreen} 
            options={{ 
              title: 'Edit Diary Entry',
              headerStyle: { backgroundColor: theme.primary },
              headerTintColor: '#fff',
            }} 
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen} 
            options={{ 
              title: 'Edit Profile',
              headerStyle: { backgroundColor: theme.primary },
              headerTintColor: '#fff',
            }} 
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ 
              title: 'Settings',
              headerStyle: { backgroundColor: theme.primary },
              headerTintColor: '#fff',
            }} 
          />
        </>
      ) : (
        // Auth Flow
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ headerShown: false }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
}
