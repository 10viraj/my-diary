import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, useWindowDimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../theme/ThemeContext';
import DesktopHeader from '../components/DesktopHeader';

export default function ProfileScreen({ navigation }: any) {
  const { theme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === 'web' && width >= 768;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isDesktop && (
        <DesktopHeader
          activeTab="Profile"
          onSelectTab={(tab) => navigation.navigate(tab)}
          onNewEntry={() => navigation.navigate('AddEntry')}
        />
      )}

      <View style={[styles.webContainer, isDesktop && styles.desktopContainer]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }, isDesktop && styles.desktopCard]}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.email, { color: theme.textMuted }]}>{user?.email || 'No email provided'}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, isDesktop && styles.desktopCard]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={[styles.menuItemText, { color: theme.text }]}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => navigation.navigate('Settings')}>
            <Text style={[styles.menuItemText, { color: theme.text }]}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={handleLogout}>
            <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  desktopContainer: {
    paddingVertical: 28,
    gap: 20,
  },
  desktopCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    backgroundColor: '#fff',
    padding: 36,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  menuItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '600',
  },
  logoutText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});
