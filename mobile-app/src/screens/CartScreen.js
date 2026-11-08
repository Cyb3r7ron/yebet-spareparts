import React, { useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const CartScreen = ({ navigation }) => {
  const { cartItems, removeFromCart, updateQuantity, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const total = getTotal();

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart is Empty', 'Add some parts before checking out!');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.cartQuantity,
          price: item.price,
          name: item.name
        })),
        totalAmount: total,
        status: 'Pending',
        customerName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
        customerEmail: user?.email,
        userId: user?.id 
      };

      await axios.post('/api/orders', orderPayload);

      Alert.alert(
        'Order Placed! 🎉', 
        'Your order has been successfully submitted.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View Orders', 
            onPress: () => {
              clearCart();
              const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
              if (isAdmin) {
                navigation.navigate('AdminHome', { screen: 'Orders' });
              } else {
                navigation.navigate('Orders');
              }
            } 
          }
        ]
      );
      clearCart();
    } catch (error) {
      console.error('Checkout error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.error || error.message;
      Alert.alert('Checkout Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.imageContainer}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : <View style={styles.placeholderImage}><Text style={styles.placeholderText}>🔧</Text></View>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.cartQuantity - 1)}><Text style={styles.qtyText}>-</Text></TouchableOpacity>
          <Text style={styles.qtyNumber}>{item.cartQuantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.cartQuantity + 1)}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id)}><Text style={styles.removeIcon}>🗑️</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ✅ NEW: Custom Header to fix stacking issue */}
      <SafeAreaView style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
      </SafeAreaView>

      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Go to Shop to add items</Text>
        </View>
      ) : (
        <>
          <FlatList data={cartItems} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]} onPress={handleCheckout} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutText}>Checkout</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  // ✅ NEW Header Styles
  headerContainer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  
  list: { padding: 20, paddingBottom: 180 },
  cartItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  imageContainer: { width: 70, height: 70, backgroundColor: '#e5e7eb', borderRadius: 8 },
  image: { width: '100%', height: '100%', borderRadius: 8 },
  placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  placeholderText: { fontSize: 24 },
  itemInfo: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  itemPrice: { fontSize: 14, color: '#2563eb', fontWeight: '600', marginBottom: 8 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  qtyNumber: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  removeBtn: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  removeIcon: { fontSize: 20 },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  emptySub: { fontSize: 16, color: '#6b7280', marginTop: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#2563eb' },
  checkoutBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  checkoutBtnDisabled: { backgroundColor: '#93c5fd' },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default CartScreen;