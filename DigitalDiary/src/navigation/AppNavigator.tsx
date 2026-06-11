import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppState, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../theme/ThemeContext';
import AppLockOverlay from '../components/AppLockOverlay';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AddEntryScreen from '../screens/AddEntryScreen';
import EntryDetailsScreen from '../screens/EntryDetailsScreen';
import EditEntryScreen from '../screens/EditEntryScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const checkAppLock = async () => {
      const lockSetting = await AsyncStorage.getItem('@app_lock');
      if (lockSetting === 'true') {
        setAppLockEnabled(true);
        if (user) setIsLocked(true); // Lock immediately on start if user is logged in
      }
    };
    checkAppLock();
  }, [user]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (appLockEnabled && user) {
          setIsLocked(true);
        }
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, [appLockEnabled, user]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
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
          <Stack.Screen 
            name="Reminders" 
            component={RemindersScreen} 
            options={{ 
              title: 'Reminders & Alerts',
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
      {user && isLocked && <AppLockOverlay onUnlock={() => setIsLocked(false)} />}
    </View>
  );
}
