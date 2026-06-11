import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { ThemeContext } from '../theme/ThemeContext';

export default function EditProfileScreen({ navigation }: any) {
  const { theme } = useContext(ThemeContext);
  const { user, updateUser } = useContext(AuthContext);
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and email cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/auth/profile', { name, email });
      await updateUser(response.data, response.data.token);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={[styles.form, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Name</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={theme.textLight}
        />

        <Text style={[styles.label, { color: theme.textMuted }]}>Email</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={theme.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.primary }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 16,
    paddingVertical: 10,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#208AEF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
