import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AnimatedTouchable from './AnimatedTouchable';
import { ThemeContext } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function AppLockOverlay({ onUnlock }: { onUnlock: () => void }) {
  const { theme } = React.useContext(ThemeContext);

  useEffect(() => {
    handleUnlock();
  }, []);

  const handleUnlock = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // If they somehow enabled it but then removed biometrics/passcode from the device,
        // we should let them in or ask for login. For now, let them in but warn them.
        Alert.alert(
          'Security Warning',
          'Your device does not have a passcode or biometric authentication set up. App Lock is compromised.',
          [{ text: 'Unlock Anyway', onPress: () => onUnlock() }]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Digital Diary',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });
      if (result.success) {
        onUnlock();
      }
    } catch (e) {
      console.error('App Lock Error:', e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={80} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Digital Diary is Locked</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Use your device's biometric authentication or passcode to continue.
      </Text>
      <AnimatedTouchable style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleUnlock}>
        <Text style={styles.buttonText}>Unlock</Text>
      </AnimatedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
