import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileEditScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.title}>⚙️ Edit Profile</Text>
      <Text style={styles.sub}>Change name, phone, password...</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({ 
  container: { flex: 1, backgroundColor: '#f3f4f6' }, 
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' }, 
  sub: { fontSize: 16, color: '#6b7280', marginTop: 8 } 
});

export default ProfileEditScreen; // ✅ FIXED: Was "ProfileScreen" before