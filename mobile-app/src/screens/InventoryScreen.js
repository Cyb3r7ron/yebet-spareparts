import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  Image, RefreshControl, TextInput, TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const InventoryScreen = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    fetchProducts();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(text.toLowerCase()) || 
        p.sku.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  // ✅ Edit Function (Placeholder for now)
  const handleEdit = (item) => {
    Alert.alert('Edit Product', `Editing: ${item.name}\n(We will build the edit form next!)`);
  };

  // ✅ Delete Function (Live API Call)
  const handleDelete = (item) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/api/products/${item.id}`);
              // Remove from local state instantly
              const updatedProducts = products.filter(p => p.id !== item.id);
              setProducts(updatedProducts);
              setFilteredProducts(updatedProducts.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.sku.toLowerCase().includes(searchQuery.toLowerCase())
              ));
              Alert.alert('Success', 'Product deleted successfully.');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete product.');
            }
          }
        }
      ]
    );
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🔧</Text>
          </View>
        )}
      </View>
      
      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.sku}>SKU: {item.sku}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <Text style={[
            styles.stock, 
            item.quantity <= (item.minStock || 5) ? styles.lowStock : styles.inStock
          ]}>
            Qty: {item.quantity}
          </Text>
        </View>
      </View>

      {/* Edit & Delete Actions Column */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>{filteredProducts.length} parts</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or SKU..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        // ✅ Adjusted bottom padding since the floating button is gone
        contentContainerStyle={styles.list} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No parts found.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerContainer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#e5e7eb'
  },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937', padding: 0 },
  clearIcon: { fontSize: 18, color: '#9ca3af', marginLeft: 10, fontWeight: 'bold' },

  // ✅ Removed the extra 100px padding since the FAB is gone
  list: { padding: 20, paddingBottom: 20 }, 
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
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
  
  // Action Buttons Styles
  actionsContainer: { justifyContent: 'center', alignItems: 'center', paddingRight: 12, gap: 12 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { backgroundColor: '#fee2e2' },
  actionIcon: { fontSize: 16 },

  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
});

export default InventoryScreen;