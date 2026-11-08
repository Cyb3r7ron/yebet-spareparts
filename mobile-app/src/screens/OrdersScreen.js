import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  TouchableOpacity, RefreshControl, Modal, ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const OrdersScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    navigation.getParent()?.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer()} style={{ marginLeft: 15 }}>
          <Text style={{ fontSize: 24 }}>☰</Text>
        </TouchableOpacity>
      ),
      headerTitle: 'All Orders',
      headerStyle: { backgroundColor: '#fff' },
    });
  }, [navigation]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      const data = response.data.orders || response.data;
      setOrders(data);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  // ✅ Update order status
    // ✅ UPDATED: Better error logging
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      console.log(`Updating Order ${orderId} to ${newStatus}...`);
      
      // Try PUT request
      await axios.put(`/api/orders/${orderId}`, { status: newStatus });
      
      // Update local state instantly
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Update status error:', error.response?.data || error.message);
      
      // Show the EXACT backend error
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to update status.';
      Alert.alert('Update Failed', errorMsg);
    }
  };

  // ✅ Show order details modal
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // ✅ Color coding for statuses
  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'delivered') return { bg: '#d1fae5', text: '#065f46' };
    if (s === 'pending') return { bg: '#fef3c7', text: '#92400e' };
    if (s === 'cancelled') return { bg: '#fee2e2', text: '#991b1b' };
    if (s === 'paid') return { bg: '#dbeafe', text: '#1e40af' };
    return { bg: '#e5e7eb', text: '#374151' };
  };

  // ✅ Truncate order ID to last 6 characters (like web version)
  const getShortOrderId = (id) => {
    if (!id) return 'N/A';
    const idStr = id.toString();
    return idStr.length > 6 ? '#' + idStr.slice(-6).toUpperCase() : '#' + idStr.toUpperCase();
  };

  const renderOrder = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    const date = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const shortId = getShortOrderId(item.id);
    const customerName = item.customerName || item.user?.name || 'Unknown';
    const customerEmail = item.customerEmail || item.user?.email || '';
    
    const totalItems = item.items ? item.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

    return (
      <View style={styles.orderCard}>
        {/* Header: Short ID, Customer, Date */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>{shortId}</Text>
            <Text style={styles.customerName}>{customerName}</Text>
            {customerEmail ? <Text style={styles.customerEmail}>{customerEmail}</Text> : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.orderDate}>{date}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {item.status || 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Items Summary */}
        <View style={styles.itemsSummary}>
          <Text style={styles.itemsLabel}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
          <Text style={styles.totalAmount}>${Number(item.totalAmount).toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {/* Status Dropdown (Admin only) */}
          {user?.role === 'ADMIN' && (
            <View style={styles.statusDropdown}>
              <Text style={styles.dropdownLabel}>Status:</Text>
              <View style={styles.dropdownButtons}>
                {['Pending', 'Paid', 'Delivered', 'Cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.dropdownBtn,
                      item.status?.toLowerCase() === status.toLowerCase() && styles.dropdownBtnActive
                    ]}
                    onPress={() => handleStatusChange(item.id, status)}
                  >
                    <Text style={[
                      styles.dropdownBtnText,
                      item.status?.toLowerCase() === status.toLowerCase() && styles.dropdownBtnTextActive
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* View Details Button */}
          <TouchableOpacity 
            style={styles.viewDetailsBtn}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySub}>Checkout some items to see them here!</Text>
          </View>
        }
      />

      {/* ✅ Order Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Order Details {getShortOrderId(selectedOrder.id)}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Customer Info */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Customer</Text>
                    <Text style={styles.modalValue}>{selectedOrder.customerName || selectedOrder.user?.name || 'Unknown'}</Text>
                    {selectedOrder.customerEmail || selectedOrder.user?.email ? (
                      <Text style={styles.modalSubValue}>{selectedOrder.customerEmail || selectedOrder.user?.email}</Text>
                    ) : null}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(selectedOrder.status).bg }]}>
                      <Text style={[styles.statusText, { color: getStatusStyle(selectedOrder.status).text }]}>
                        {selectedOrder.status || 'Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Items List */}
                  <Text style={styles.modalSectionTitle}>Items</Text>
                  {selectedOrder.items && selectedOrder.items.map((orderItem, index) => (
                    <View key={index} style={styles.modalItemRow}>
                      <View style={styles.modalItemInfo}>
                        <Text style={styles.modalItemName}>{orderItem.name}</Text>
                        <Text style={styles.modalItemQty}>${orderItem.price.toFixed(2)} x {orderItem.quantity}</Text>
                      </View>
                      <Text style={styles.modalItemPrice}>${(orderItem.price * orderItem.quantity).toFixed(2)}</Text>
                    </View>
                  ))}

                  <View style={styles.modalDivider} />

                  {/* Total */}
                  <View style={styles.modalTotalRow}>
                    <Text style={styles.modalTotalLabel}>Total Amount</Text>
                    <Text style={styles.modalTotalAmount}>${Number(selectedOrder.totalAmount).toFixed(2)}</Text>
                  </View>
                </ScrollView>

                <TouchableOpacity 
                  style={styles.closeModalBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeModalText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingBottom: 40 },
  
  orderCard: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  customerName: { fontSize: 14, color: '#374151', marginTop: 2 },
  customerEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  orderDate: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  itemsSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemsLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  
  actionRow: { marginTop: 8 },
  statusDropdown: { marginBottom: 12 },
  dropdownLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 6 },
  dropdownButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dropdownBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f3f4f6' },
  dropdownBtnActive: { backgroundColor: '#2563eb' },
  dropdownBtnText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  dropdownBtnTextActive: { color: '#fff' },
  
  viewDetailsBtn: { backgroundColor: '#dbeafe', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  viewDetailsText: { color: '#2563eb', fontSize: 14, fontWeight: 'bold' },
  
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6b7280', fontWeight: 'bold' },
  emptySub: { fontSize: 14, color: '#9ca3af', marginTop: 4 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  closeIcon: { fontSize: 24, color: '#6b7280' },
  modalBody: { padding: 20 },
  modalSection: { marginBottom: 16 },
  modalLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  modalValue: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  modalSubValue: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  modalSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  modalItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalItemInfo: { flex: 1 },
  modalItemName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  modalItemQty: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  modalItemPrice: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  modalDivider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 },
  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  modalTotalAmount: { fontSize: 20, fontWeight: 'bold', color: '#2563eb' },
  closeModalBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', margin: 20 },
  closeModalText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default OrdersScreen;