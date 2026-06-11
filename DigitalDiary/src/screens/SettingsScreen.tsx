import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../theme/ThemeContext';

export default function SettingsScreen({ navigation }: any) {
  const { isDarkMode, toggleTheme, theme } = useContext(ThemeContext);
  const [biometric, setBiometric] = React.useState(false);

  useEffect(() => {
    const loadBiometric = async () => {
      const value = await AsyncStorage.getItem('@app_lock');
      if (value === 'true') {
        setBiometric(true);
      }
    };
    loadBiometric();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    setBiometric(value);
    await AsyncStorage.setItem('@app_lock', value ? 'true' : 'false');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textLight }]}>App Settings</Text>
        
        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.settingText, { color: theme.text }]}>Dark Mode</Text>
          <Switch 
            value={isDarkMode} 
            onValueChange={toggleTheme}
            trackColor={{ false: "#d3d3d3", true: theme.primary }}
            thumbColor={isDarkMode ? theme.surface : "#f4f3f4"}
          />
        </View>



        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.settingText, { color: theme.text }]}>Biometric Lock (Face/Touch ID)</Text>
          <Switch 
            value={biometric} 
            onValueChange={handleBiometricToggle}
            trackColor={{ false: "#d3d3d3", true: theme.primary }}
            thumbColor={biometric ? theme.surface : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textLight }]}>About</Text>
        
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.linkText, { color: theme.text }]}>Privacy Policy</Text>
          <Text style={[styles.chevron, { color: theme.textLight }]}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.linkText, { color: theme.text }]}>Terms of Service</Text>
          <Text style={[styles.chevron, { color: theme.textLight }]}>›</Text>
        </TouchableOpacity>

        <View style={styles.versionRow}>
          <Text style={[styles.versionText, { color: theme.text }]}>Version</Text>
          <Text style={[styles.versionNumber, { color: theme.textMuted }]}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginLeft: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fafafa',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fafafa',
  },
  linkText: {
    fontSize: 16,
    color: '#333',
  },
  chevron: {
    fontSize: 20,
    color: '#ccc',
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 16,
    color: '#333',
  },
  versionNumber: {
    fontSize: 16,
    color: '#888',
  },
});
