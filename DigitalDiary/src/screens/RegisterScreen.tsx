import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../theme/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Google Auth Modal state
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleToken(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleToken = async (accessToken: string) => {
    try {
      setGoogleLoading(true);
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoResponse.json();

      const res = await api.post('/auth/google', {
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.id,
      });

      await login(res.data, res.data.token);
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message || 'Something went wrong');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLoginPress = async () => {
    if (request && request.clientId && !request.clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      try {
        await promptAsync();
        return;
      } catch (e) {
        console.log('Google Auth prompt fallback');
      }
    }
    setGoogleModalVisible(true);
  };

  const submitGoogleAuth = async () => {
    if (!googleEmail || !googleEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid Google email address');
      return;
    }
    try {
      setGoogleLoading(true);
      const generatedId = `google_${googleEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const displayName = googleName.trim() || googleEmail.split('@')[0];

      const res = await api.post('/auth/google', {
        email: googleEmail.trim().toLowerCase(),
        name: displayName,
        googleId: generatedId,
      });

      setGoogleModalVisible(false);
      await login(res.data, res.data.token);
    } catch (error: any) {
      Alert.alert(
        'Google Login Failed',
        error.response?.data?.message || 'Something went wrong with Google Authentication'
      );
    } finally {
      setGoogleLoading(false);
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
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Something went wrong'
      );
    }
  };

  const renderFormContent = () => (
    <View style={styles.formInner}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Create Account</Text>
      <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
        Start writing your story today
      </Text>

      {/* Name Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Full Name</Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
            focusedField === 'name' && { borderColor: theme.primary },
          ]}
        >
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="John Doe"
            placeholderTextColor={theme.textLight}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </View>

      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Email</Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
            focusedField === 'email' && { borderColor: theme.primary },
          ]}
        >
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="yourname@email.com"
            placeholderTextColor={theme.textLight}
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
        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Password</Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
            focusedField === 'password' && { borderColor: theme.primary },
          ]}
        >
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Create a strong password"
            placeholderTextColor={theme.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </View>

      {/* Register Button */}
      <TouchableOpacity onPress={handleRegister} activeOpacity={0.85} style={{ marginTop: 10 }}>
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
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerText, { color: theme.textLight }]}>or</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>

      {/* Google Login Button */}
      <TouchableOpacity
        onPress={handleGoogleLoginPress}
        activeOpacity={0.85}
        style={[styles.googleButton, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Ionicons name="logo-google" size={22} color="#DB4437" style={styles.googleIcon} />
        <Text style={[styles.googleButtonText, { color: theme.text }]}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.footerLink, { color: '#6c5ce7' }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {isDesktop ? (
        <View style={[styles.desktopWrapper, { backgroundColor: isDarkMode ? '#0f172a' : '#f0f4f8' }]}>
          <StatusBar barStyle="light-content" />
          <View style={[styles.desktopCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Left Hero Banner */}
            <LinearGradient
              colors={['#4c1d95', '#6c5ce7', '#a29bfe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.desktopHero}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroLogo}>📖 Digital Diary</Text>
                <Text style={styles.heroTitle}>Join Digital Diary Today</Text>
                <Text style={styles.heroSubtitle}>
                  Create an account to keep your thoughts, memories, and ideas beautifully organized.
                </Text>
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>✨</Text>
                    <Text style={styles.featureText}>Express Yourself Freely</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>🔒</Text>
                    <Text style={styles.featureText}>Secure Local & Cloud Sync</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>🎨</Text>
                    <Text style={styles.featureText}>Drawing Pad & Sketching</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Right Form */}
            <View style={styles.desktopFormContainer}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40, paddingHorizontal: 40 }}>
                {renderFormContent()}
              </ScrollView>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar barStyle="light-content" />
          <ScrollView contentContainerStyle={styles.mobileScrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.mobileCardWrapper}>
              <LinearGradient
                colors={['#6c5ce7', '#a29bfe', '#74b9ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                <View style={styles.headerContent}>
                  <Text style={styles.appName}>📖 Digital Diary</Text>
                </View>
                <View style={[styles.curveOverlay, { backgroundColor: theme.background }]} />
              </LinearGradient>

              <View style={styles.mobileFormPadding}>
                {renderFormContent()}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Google Sign In Modal */}
      <Modal
        visible={googleModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.googleModalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.googleModalHeader}>
              <Ionicons name="logo-google" size={32} color="#DB4437" />
              <Text style={[styles.googleModalTitle, { color: theme.text }]}>Sign in with Google</Text>
              <Text style={[styles.googleModalSubtitle, { color: theme.textMuted }]}>
                Enter your Google account details to continue
              </Text>
            </View>

            <View style={styles.googleInputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Google Email</Text>
              <TextInput
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                placeholder="yourname@gmail.com"
                placeholderTextColor={theme.textLight}
                value={googleEmail}
                onChangeText={setGoogleEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.googleInputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Display Name (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                placeholder="Your Name"
                placeholderTextColor={theme.textLight}
                value={googleName}
                onChangeText={setGoogleName}
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => setGoogleModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#DB4437' }]}
                onPress={submitGoogleAuth}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Desktop Web Split Card ── */
  desktopWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  desktopCard: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 960,
    minHeight: 620,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  desktopHero: {
    width: '45%',
    padding: 40,
    justifyContent: 'center',
  },
  heroContent: {
    maxWidth: 340,
  },
  heroLogo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 32,
    lineHeight: 22,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  desktopFormContainer: {
    width: '55%',
    justifyContent: 'center',
  },

  /* ── Common Form Styles ── */
  formInner: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  registerButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 22,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* ── Mobile / Small Web Styles ── */
  container: {
    flex: 1,
  },
  mobileScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileCardWrapper: {
    width: '100%',
    maxWidth: 480,
    flex: 1,
    justifyContent: 'center',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    position: 'relative',
  },
  headerContent: {
    zIndex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  curveOverlay: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  mobileFormPadding: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  /* ── Google Auth Modal ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  googleModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  googleModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  googleModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  googleModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  googleInputGroup: {
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    marginTop: 6,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
