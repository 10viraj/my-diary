import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../theme/ThemeContext';

export default function ProfileScreen({ navigation }: any) {
  const { theme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await logout();
      // AppNavigator will automatically transition to the Auth Stack because user becomes null
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  // Generate initials from the user's name (e.g., "John Doe" -> "JD")
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
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.email, { color: theme.textMuted }]}>{user?.email || 'No email provided'}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
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
    fontSize: 18,
    color: '#333',
  },
  logoutText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});
