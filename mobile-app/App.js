import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';

// Admin Screens
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import EditProductScreen from './src/screens/EditProductScreen';
import UsersScreen from './src/screens/UsersScreen';

// Shared/User Screens
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import ShopScreen from './src/screens/ShopScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// ==========================================
// 1. ADMIN DRAWER CONTENT
// ==========================================
function AdminDrawerContent(props) {
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: insets.top }}>
      <View style={styles.drawerHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text></View>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.userRole}>{user?.role}</Text>
      </View>
      <DrawerItemList {...props} />
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutButton} onPress={async () => { await logout(); props.navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

// ==========================================
// 2. ADMIN BOTTOM TABS (5 Buttons)
// ==========================================
function AdminTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        if (route.name === 'AddProduct') {
          return (
            <View key={route.key} style={styles.fabWrapper}>
              <TouchableOpacity onPress={() => navigation.navigate(route.name)} style={styles.fabTab}>
                <Text style={styles.fabTabText}>+</Text>
              </TouchableOpacity>
            </View>
          );
        }
        let label = route.name === 'Dashboard' ? 'Home' : route.name === 'Inventory' ? 'Parts' : route.name === 'Scanner' ? 'Scan' : 'Orders';
        return (
          <TouchableOpacity key={route.key} onPress={() => navigation.navigate(route.name)} style={styles.standardTab}>
            {options.tabBarIcon ? options.tabBarIcon({ focused: isFocused }) : null}
            <Text style={[styles.tabLabel, { color: isFocused ? '#2563eb' : '#9ca3af' }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator tabBar={props => <AdminTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: () => <Text style={styles.tabIcon}>🏠</Text> }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ tabBarIcon: () => <Text style={styles.tabIcon}>📦</Text> }} />
      <Tab.Screen name="AddProduct" component={AddProductScreen} options={{ tabBarLabel: 'Add' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: () => <Text style={styles.tabIcon}>📋</Text> }} />
      <Tab.Screen name="Scanner" component={ScannerScreen} options={{ tabBarIcon: () => <Text style={styles.tabIcon}>📷</Text> }} />
    </Tab.Navigator>
  );
}

// ==========================================
// 3. USER BOTTOM TABS (4 Buttons - NO DRAWER)
// ==========================================
function UserTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        let label = route.name;
        if (route.name === 'Shop') label = 'Shop';
        if (route.name === 'Orders') label = 'Orders';
        if (route.name === 'Profile') label = 'Profile';
        if (route.name === 'Cart') label = 'Cart';

        return (
          <TouchableOpacity key={route.key} onPress={() => navigation.navigate(route.name)} style={styles.standardTab}>
            {options.tabBarIcon ? options.tabBarIcon({ focused: isFocused }) : null}
            <Text style={[styles.tabLabel, { color: isFocused ? '#2563eb' : '#9ca3af' }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function UserTabs() {
  return (
    <Tab.Navigator tabBar={props => <UserTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Shop" component={ShopScreen} options={{ tabBarIcon: () => <Text style={styles.tabIcon}>🛍️</Text> }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: () => <Text style={styles.tabIcon}>📋</Text> }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarIcon: () => <Text style={styles.tabIcon}>🛒</Text> }} />
      <Tab.Screen name="Profile" component={ProfileEditScreen} options={{ tabBarIcon: () => <Text style={styles.tabIcon}>👤</Text> }} />
    </Tab.Navigator>
  );
}

// ==========================================
// 4. ADMIN DRAWER NAVIGATOR (Wrapped properly)
// ==========================================
function AdminDrawer() {
  return (
    <Drawer.Navigator drawerContent={(props) => <AdminDrawerContent {...props} />} screenOptions={{ headerShown: true, drawerActiveTintColor: '#2563eb', drawerStyle: { backgroundColor: '#fff', width: 280 } }}>
      <Drawer.Screen name="AdminHome" component={AdminTabs} options={{ drawerLabel: 'Dashboard', drawerIcon: () => <Text style={{fontSize: 22}}>🏠</Text> }} />
      <Drawer.Screen name="Cart" component={CartScreen} options={{ drawerLabel: 'Shopping Cart', drawerIcon: () => <Text style={{fontSize: 22}}>🛒</Text> }} />
      <Drawer.Screen name="UserManagement" component={UsersScreen} options={{ drawerLabel: 'User Management', drawerIcon: () => <Text style={{fontSize: 22}}>👥</Text> }} />
      <Drawer.Screen name="EditProfile" component={ProfileEditScreen} options={{ drawerLabel: 'Edit Profile', drawerIcon: () => <Text style={{fontSize: 22}}>⚙️</Text> }} />
    </Drawer.Navigator>
  );
}

// ==========================================
// 5. ROOT APP NAVIGATOR
// ==========================================
export default function App() {
  const { loadUser, isLoading, token, user } = useAuthStore();
  useEffect(() => { loadUser(); }, []);

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'MANAGER';

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!token ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              {/* ✅ FIXED: Both Admin and User navigators are now properly wrapped in Stack.Screen */}
              {isAdmin ? (
                <Stack.Screen name="AdminDrawer" component={AdminDrawer} />
              ) : (
                <Stack.Screen name="UserTabs" component={UserTabs} />
              )}
              
              <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  tabIcon: { fontSize: 24 },
  tabBarContainer: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
  standardTab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  fabWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -30 },
  fabTab: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8, borderWidth: 4, borderColor: '#fff' },
  fabTabText: { fontSize: 32, color: '#fff', fontWeight: '300', marginTop: -4 },
  drawerHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  userRole: { fontSize: 14, color: '#2563eb', fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
  drawerFooter: { marginTop: 'auto', padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, backgroundColor: '#fee2e2' },
  logoutIcon: { fontSize: 20, marginRight: 8 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' }
});