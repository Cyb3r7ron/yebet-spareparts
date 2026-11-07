import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ Added SafeAreaView
import { useAuthStore } from '../store/authStore';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
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
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  return (
    // ✅ Replaced View with SafeAreaView
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  email: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  role: { 
    fontSize: 14, fontWeight: '600', color: '#2563eb', backgroundColor: '#dbeafe', 
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 
  },
  logoutButton: {
    backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 12, alignItems: 'center'
  },
  logoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default ProfileScreen;