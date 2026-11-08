import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuthStore();
  
  // 'login', 'signup', or 'forgot'
  const [mode, setMode] = useState('login'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) { Alert.alert('Error', 'Email is required.'); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        if (!password) { Alert.alert('Error', 'Password is required.'); setLoading(false); return; }
        await login(email, password);
        // Navigation is handled automatically by the root App.js when token updates!
      } 
      else if (mode === 'signup') {
        if (!password || !firstName || !lastName) { Alert.alert('Error', 'All fields are required.'); setLoading(false); return; }
        await axios.post('/api/auth/register', { firstName, lastName, email, password });
        Alert.alert('Success!', 'Account created! Please log in.', [{ text: 'OK', onPress: () => setMode('login') }]);
      } 
      else if (mode === 'forgot') {
        await axios.post('/api/auth/forgot-password', { email });
        Alert.alert('Email Sent!', 'Check your inbox for password reset instructions.');
        setMode('login');
      }
    } catch (error) {
      console.error('Auth error:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'An error occurred.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={styles.logoText}>🔧 Yebet Spare Parts</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </Text>
          </View>

          {/* Toggle Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, mode === 'login' && styles.activeTab]} 
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, mode === 'signup' && styles.activeTab]} 
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            {/* Sign Up Fields */}
            {mode === 'signup' && (
              <>
                <Text style={styles.label}>First Name</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
                <Text style={styles.label}>Last Name</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
              </>
            )}

            {/* Email Field (Always visible) */}
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              autoCapitalize="none" 
              placeholder="you@example.com"
            />

            {/* Password Field (Hidden on Forgot Password) */}
            {mode !== 'forgot' && (
              <>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput 
                    style={[styles.input, styles.passwordInput]} 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry={!showPassword} 
                    placeholder="Enter password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <TouchableOpacity onPress={() => setMode('forgot')} style={styles.forgotLink}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
              onPress={handleSubmit} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.submitText}>
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContent: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 30 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#6b7280', fontWeight: '500' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: '#2563eb' },

  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937' },
  
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10 },
  passwordInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingVertical: 12 },
  eyeButton: { padding: 12 },
  eyeIcon: { fontSize: 20 },

  forgotLink: { alignItems: 'flex-end', marginTop: 12 },
  forgotText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },

  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default LoginScreen;