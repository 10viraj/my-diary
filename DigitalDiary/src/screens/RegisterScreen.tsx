import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useContext(AuthContext);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Replace with real ID
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleLogin(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (accessToken: string) => {
    try {
      // Fetch user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoResponse.json();

      // Send to backend
      const res = await api.post('/auth/google', {
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.id,
      });

      await login(res.data, res.data.token);
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message || 'Something went wrong');
    }
  };

  const handleRegister = async () => {
    try {
      if (!name || !email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const response = await api.post('/auth/register', { name, email, password });
      await login(response.data, response.data.token);
      // Navigation to MainTabs is handled automatically by AppNavigator reacting to user state
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Something went wrong'
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top gradient header */}
      <LinearGradient
        colors={['#6c5ce7', '#a29bfe', '#74b9ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.appName}>📖 Digital Diary</Text>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Start writing your story today</Text>
        </View>
        <View style={styles.curveOverlay} />
      </LinearGradient>

      {/* Form area */}
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'name' && styles.inputContainerFocused,
              ]}
            >
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#aab4c0"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'email' && styles.inputContainerFocused,
              ]}
            >
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="yourname@email.com"
                placeholderTextColor="#aab4c0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'password' && styles.inputContainerFocused,
              ]}
            >
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor="#aab4c0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            activeOpacity={0.85}
            style={{ marginTop: 10 }}
          >
            <LinearGradient
              colors={['#6c5ce7', '#a29bfe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButton}
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            onPress={() => promptAsync()}
            activeOpacity={0.85}
            style={styles.googleButton}
          >
            <Ionicons name="logo-google" size={24} color="#DB4437" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },

  /* ── Header ── */
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 60,
    paddingHorizontal: 30,
    position: 'relative',
  },
  headerContent: {
    zIndex: 1,
  },
  appName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  curveOverlay: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#f0f4f8',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  /* ── Form ── */
  formWrapper: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: '#6c5ce7',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2d3748',
  },

  /* ── Register Button ── */
  registerButton: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* ── Google Button ── */
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 25,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '700',
  },

  /* ── Divider ── */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#a0aec0',
    fontWeight: '500',
  },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#718096',
  },
  footerLink: {
    fontSize: 15,
    color: '#6c5ce7',
    fontWeight: '700',
  },
});
