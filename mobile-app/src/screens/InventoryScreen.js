import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useCartStore } from '../store/cartStore'; // ✅ Import Cart Store

const InventoryScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const addToCart = useCartStore(state => state.addToCart); // ✅ Get add function

  useEffect(() => {
    navigation.getParent()?.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer()} style={{ marginLeft: 15 }}>
          <Text style={{ fontSize: 24 }}>☰</Text>
        </TouchableOpacity>
      ),
      headerTitle: 'Inventory',
      headerStyle: { backgroundColor: '#fff' },
    });
  }, [navigation]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      const data = response.data.products;
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      Alert.alert('Error', 'Failed to load inventory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const onRefresh = () => { setRefreshing(true); setSearchQuery(''); fetchProducts(); };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text === '') { setFilteredProducts(products); } 
    else {
      const filtered = products.filter(p => p.name.toLowerCase().includes(text.toLowerCase()) || p.sku.toLowerCase().includes(text.toLowerCase()));
      setFilteredProducts(filtered);
    }
  };

  const handleEdit = (item) => { navigation.navigate('EditProduct', { product: item }); };

  const handleDelete = (item) => {
    Alert.alert('Delete Product', `Are you sure you want to delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`/api/products/${item.id}`);
            const updated = products.filter(p => p.id !== item.id);
            setProducts(updated);
            setFilteredProducts(updated.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())));
            Alert.alert('Success', 'Product deleted.');
          } catch (error) { Alert.alert('Error', 'Failed to delete.'); }
        }
      }
    ]);
  };

  // ✅ Handle Add to Cart
  const handleAddToCart = (item) => {
    addToCart(item);
    Alert.alert('Added to Cart!', `${item.name} added to your cart.`);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : <View style={styles.placeholderImage}><Text style={styles.placeholderText}>🔧</Text></View>}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.sku}>SKU: {item.sku}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <Text style={[styles.stock, item.quantity <= (item.minStock || 5) ? styles.lowStock : styles.inStock]}>Qty: {item.quantity}</Text>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        {/* ✅ NEW: Cart Button */}
        <TouchableOpacity style={[styles.actionBtn, styles.cartBtn]} onPress={() => handleAddToCart(item)}>
          <Text style={styles.actionIcon}>🛒</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}><Text style={styles.actionIcon}>✏️</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}><Text style={styles.actionIcon}>🗑️</Text></TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search by name or SKU..." placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={handleSearch} />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => handleSearch('')}><Text style={styles.clearIcon}>✕</Text></TouchableOpacity>}
        </View>
      </SafeAreaView>

      <FlatList data={filteredProducts} keyExtractor={(item) => item.id} renderItem={renderProduct} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No parts found.</Text></View>} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937', padding: 0 },
  clearIcon: { fontSize: 18, color: '#9ca3af', marginLeft: 10, fontWeight: 'bold' },
  list: { padding: 20, paddingBottom: 20 }, 
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  imageContainer: { width: 80, height: 90, backgroundColor: '#e5e7eb' },
  image: { width: '100%', height: '100%' },
  placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 32 },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  sku: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' },
  stock: { fontSize: 12, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  inStock: { backgroundColor: '#d1fae5', color: '#065f46' },
  lowStock: { backgroundColor: '#fee2e2', color: '#991b1b' },
  actionsContainer: { justifyContent: 'center', alignItems: 'center', paddingRight: 12, gap: 10 }, // Reduced gap slightly to fit 3 buttons
  actionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  cartBtn: { backgroundColor: '#dbeafe' }, // Light blue for cart
  deleteBtn: { backgroundColor: '#fee2e2' },
  actionIcon: { fontSize: 16 },
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
});

export default InventoryScreen;