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
        if (user) setIsLocked(true);
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Main App Flow
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={TabNavigator} 
            />
            <Stack.Screen 
              name="AddEntry" 
              component={AddEntryScreen} 
            />
            <Stack.Screen 
              name="EntryDetails" 
              component={EntryDetailsScreen} 
            />
            <Stack.Screen 
              name="EditEntry" 
              component={EditEntryScreen} 
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen} 
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen} 
            />
          </>
        ) : (
          // Auth Flow
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
            />
          </>
        )}
      </Stack.Navigator>
      {user && isLocked && <AppLockOverlay onUnlock={() => setIsLocked(false)} />}
    </View>
  );
}
