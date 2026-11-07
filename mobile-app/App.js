import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddProductScreen from './src/screens/AddProductScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ✅ FIXED: CUSTOM TAB BAR COMPONENT
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];

        // ✅ THE SPECIAL MIDDLE "ADD" BUTTON
        if (route.name === 'AddProduct') {
          return (
            <View key={route.key} style={styles.fabWrapper}>
              <TouchableOpacity
                onPress={() => navigation.navigate(route.name)}
                style={styles.fabTab}
              >
                <Text style={styles.fabTabText}>+</Text>
              </TouchableOpacity>
            </View>
          );
        }

        // ✅ STANDARD TABS (Fixed Icon Rendering)
        let label = route.name;
        if (route.name === 'Dashboard') label = 'Home';
        if (route.name === 'Inventory') label = 'Parts';
        if (route.name === 'Scanner') label = 'Scan';
        if (route.name === 'Profile') label = 'Profile';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.standardTab}
          >
            {/* ✅ FIX: Render the icon directly without wrapping it in a Text tag */}
            {options.tabBarIcon ? options.tabBarIcon({ focused: isFocused }) : null}
            
            <Text style={[styles.tabLabel, { color: isFocused ? '#2563eb' : '#9ca3af' }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarIcon: () => <Text style={styles.tabIcon}>🏠</Text> }} 
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{ tabBarIcon: () => <Text style={styles.tabIcon}>📦</Text> }} 
      />
      {/* ✅ The middle button */}
      <Tab.Screen 
        name="AddProduct" 
        component={AddProductScreen} 
        options={{ tabBarLabel: 'Add' }} 
      />
      <Tab.Screen 
        name="Scanner" 
        component={ScannerScreen} 
        options={{ tabBarIcon: () => <Text style={styles.tabIcon}>📷</Text> }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarIcon: () => <Text style={styles.tabIcon}>⚙️</Text> }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { loadUser, isLoading, token } = useAuthStore();

  useEffect(() => { loadUser(); }, []);

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token ? (
            <Stack.Screen name="MainTabs" component={MainTabs} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  tabIcon: { fontSize: 24 }, // ✅ Base style for icons
  
  // Custom Tab Bar Styles
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
    // paddingBottom is handled dynamically by insets.bottom in the component
  },
  standardTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  
  // The Elevated Middle Button
  fabWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30, // Pulls the button up visually
  },
  fabTab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#fff', // Creates the cutout effect
  },
  fabTabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -4,
  }
});