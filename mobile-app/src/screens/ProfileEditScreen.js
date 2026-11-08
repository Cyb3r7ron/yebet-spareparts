import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const ProfileEditScreen = ({ navigation }) => {
  const { user, loadUser, logout } = useAuthStore(); // ✅ Added logout
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!firstName || !lastName) { Alert.alert('Missing Fields', 'First Name and Last Name are required.'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('phone', phone);
      await axios.patch('/api/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadUser();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile.');
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { Alert.alert('Missing Fields', 'Please enter both current and new password.'); return; }
    if (newPassword.length < 6) { Alert.alert('Invalid Password', 'New password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await axios.patch('/api/users/password', { currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword('');
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  // ✅ NEW: Handle Logout
  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 Profile Information</Text>
            <Text style={styles.label}>First Name *</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            <Text style={styles.label}>Last Name *</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+1 234 567 8900" />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveProfile} disabled={loading}>
              <Text style={styles.submitText}>Save Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔒 Change Password</Text>
            <Text style={styles.label}>Current Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput style={[styles.input, styles.passwordInput]} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showCurrentPassword} placeholder="Enter current password" />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeButton}><Text style={styles.eyeIcon}>{showCurrentPassword ? '🙈' : '👁️'}</Text></TouchableOpacity>
            </View>
            <Text style={styles.label}>New Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput style={[styles.input, styles.passwordInput]} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} placeholder="Enter new password (min 6 chars)" />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}><Text style={styles.eyeIcon}>{showNewPassword ? '🙈' : '👁️'}</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword} disabled={loading}>
              <Text style={styles.submitText}>Update Password</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ NEW: Logout Button at the bottom */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  headerContainer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10 },
  passwordInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingVertical: 12 },
  eyeButton: { padding: 12 },
  eyeIcon: { fontSize: 20 },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // ✅ Logout Button Styles
  logoutBtn: { backgroundColor: '#fee2e2', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#fecaca' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' }
});

export default ProfileEditScreen;