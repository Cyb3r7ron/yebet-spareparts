import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  TouchableOpacity, RefreshControl, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const UsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Menu Button to Header
  useEffect(() => {
    navigation.getParent()?.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer()} style={{ marginLeft: 15 }}>
          <Text style={{ fontSize: 24 }}>☰</Text>
        </TouchableOpacity>
      ),
      headerTitle: 'User Management',
      headerStyle: { backgroundColor: '#fff' },
    });
  }, [navigation]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.users || response.data);
    } catch (error) {
      console.error('Fetch users error:', error);
      Alert.alert('Error', 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  // Color coding for roles
  const getRoleColor = (role) => {
    if (role === 'ADMIN') return { bg: '#fee2e2', text: '#991b1b' };
    if (role === 'MANAGER') return { bg: '#dbeafe', text: '#1e40af' };
    return { bg: '#d1fae5', text: '#065f46' };
  };

  const renderUser = ({ item }) => {
    const roleStyle = getRoleColor(item.role);
    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        
        {/* Clean Role Badge (Read-Only) */}
        <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
          <Text style={[styles.roleText, { color: roleStyle.text }]}>{item.role}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No users found</Text></View>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingBottom: 40 },
  userCard: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 16, 
    padding: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  userEmail: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', fontWeight: 'bold' }
});

export default UsersScreen;