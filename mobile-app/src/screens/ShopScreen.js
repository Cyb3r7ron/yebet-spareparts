import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  Image, RefreshControl, TextInput, TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useCartStore } from '../store/cartStore';

const ShopScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const addToCart = useCartStore(state => state.addToCart);

  // ✅ REMOVED: Drawer button logic since users don't have a drawer anymore.

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products);
    } catch (error) {
      Alert.alert('Error', 'Failed to load shop.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const handleAddToCart = (item) => {
    addToCart(item);
    Alert.alert('Added!', `${item.name} added to cart.`);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : <View style={styles.placeholderImage}><Text style={styles.placeholderText}>🔧</Text></View>}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <Text style={[styles.stock, item.quantity <= 0 ? styles.outOfStock : styles.inStock]}>
            {item.quantity <= 0 ? 'Sold Out' : `Qty: ${item.quantity}`}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, item.quantity <= 0 && styles.disabledBtn]} 
          onPress={() => item.quantity > 0 && handleAddToCart(item)}
          disabled={item.quantity <= 0}
        >
          <Text style={styles.addBtnText}>{item.quantity <= 0 ? 'Sold Out' : 'Add to Cart'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Spare Parts Shop</Text>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search parts..." placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </SafeAreaView>

      <FlatList 
        data={products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))} 
        keyExtractor={(item) => item.id} 
        renderItem={renderProduct} 
        contentContainerStyle={styles.list} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937', padding: 0 },
  list: { padding: 20, paddingBottom: 40 }, 
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  imageContainer: { width: 100, height: 100, backgroundColor: '#e5e7eb' },
  image: { width: '100%', height: '100%' },
  placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 32 },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  category: { fontSize: 12, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  stock: { fontSize: 12, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  inStock: { backgroundColor: '#d1fae5', color: '#065f46' },
  outOfStock: { backgroundColor: '#fee2e2', color: '#991b1b' },
  addBtn: { backgroundColor: '#2563eb', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#9ca3af' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});

export default ShopScreen;