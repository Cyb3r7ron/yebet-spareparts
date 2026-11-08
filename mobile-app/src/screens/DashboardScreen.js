import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const [selectedRange, setSelectedRange] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, lowStockItems: [], userStats: null, barChartData: { labels: [], datasets: [{ data: [] }] }, topProducts: [] });

  // ✅ Opens the Side Drawer
  useEffect(() => {
    navigation.getParent()?.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer()} style={{ marginLeft: 15 }}>
          <Text style={{ fontSize: 24 }}>☰</Text>
        </TouchableOpacity>
      ),
      headerTitle: 'Dashboard',
      headerStyle: { backgroundColor: '#fff' },
    });
  }, [navigation]);

  const calculateDates = (range) => {
    const end = new Date(); const start = new Date();
    if (range === '7d') start.setDate(end.getDate() - 7);
    else if (range === '30d') start.setDate(end.getDate() - 30);
    else if (range === '90d') start.setDate(end.getDate() - 90);
    else if (range === 'year') start.setFullYear(end.getFullYear(), 0, 1);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
    const dates = calculateDates(range);
    setStartDate(dates.start); setEndDate(dates.end);
  };

  const fetchDashboardData = async () => {
    if (!startDate || !endDate) return;
    try {
      const userResponse = await axios.get('/api/auth/me');
      const salesResponse = await axios.get(`/api/sales?startDate=${startDate}&endDate=${endDate}`);
      const productsResponse = await axios.get('/api/products');
      const lowStock = productsResponse.data.products.filter(p => p.quantity <= (p.minStock || 5) && p.quantity > 0);

      const salesByDate = {};
      salesResponse.data.salesData.forEach(sale => {
        const date = new Date(sale.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        salesByDate[date] = (salesByDate[date] || 0) + sale.totalAmount;
      });

      const productRevenue = {};
      salesResponse.data.salesData.forEach(sale => { productRevenue[sale.productName] = (productRevenue[sale.productName] || 0) + sale.totalAmount; });
      const topProducts = Object.entries(productRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, revenue]) => ({ name, revenue }));

      setStats({
        totalRevenue: salesResponse.data.summary.totalRevenue,
        totalOrders: salesResponse.data.summary.totalTransactions,
        lowStockItems: lowStock,
        userStats: userResponse.data.user,
        barChartData: { labels: Object.keys(salesByDate), datasets: [{ data: Object.values(salesByDate) }] },
        topProducts
      });
    } catch (error) { console.error('Failed to fetch dashboard data:', error); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { const initialDates = calculateDates('30d'); setStartDate(initialDates.start); setEndDate(initialDates.end); }, []);
  useEffect(() => { if (startDate && endDate) { setLoading(true); fetchDashboardData(); } }, [startDate, endDate]);

  const onRefresh = () => { setRefreshing(true); fetchDashboardData(); };
  const handleLogout = async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); };

  if (loading && !stats.userStats) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  const filters = [{ id: '7d', label: '7 Days' }, { id: '30d', label: '30 Days' }, { id: '90d', label: '90 Days' }, { id: 'year', label: 'This Year' }];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{stats.userStats?.firstName} {stats.userStats?.lastName}</Text>
          <Text style={styles.roleText}>{stats.userStats?.role}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
          {filters.map((filter) => (
            <TouchableOpacity key={filter.id} style={[styles.filterChip, selectedRange === filter.id && styles.filterChipActive]} onPress={() => handleRangeSelect(filter.id)}>
              <Text style={[styles.filterText, selectedRange === filter.id && styles.filterTextActive]}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cardsContainer}>
          <View style={[styles.card, styles.revenueCard]}>
            <View style={styles.iconContainer}><Text style={styles.icon}>💰</Text></View>
            <View style={styles.cardTextContainer}><Text style={styles.cardLabel}>Revenue</Text><Text style={styles.cardValue}>${Number(stats.totalRevenue).toLocaleString()}</Text></View>
          </View>
          <View style={[styles.card, styles.ordersCard]}>
            <View style={styles.iconContainer}><Text style={styles.icon}>📦</Text></View>
            <View style={styles.cardTextContainer}><Text style={styles.cardLabel}>Total Orders</Text><Text style={styles.cardValue}>{stats.totalOrders}</Text></View>
          </View>
          <View style={[styles.card, styles.lowStockCard]}>
            <View style={styles.iconContainer}><Text style={styles.icon}>⚠️</Text></View>
            <View style={styles.cardTextContainer}><Text style={styles.cardLabel}>Low Stock</Text><Text style={styles.cardValue}>{stats.lowStockItems.length}</Text></View>
          </View>
        </View>

        {stats.barChartData.labels.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>📈 Sales Trend</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart data={stats.barChartData} width={Math.max(screenWidth - 40, stats.barChartData.labels.length * 50)} height={180} yAxisLabel="$" chartConfig={{ backgroundColor: '#ffffff', backgroundGradientFrom: '#ffffff', backgroundGradientTo: '#ffffff', decimalCount: 0, color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }} style={{ marginVertical: 8, borderRadius: 16 }} fromZero />
            </ScrollView>
          </View>
        )}

        {stats.topProducts.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>🏆 Top Products</Text>
            {stats.topProducts.map((product, index) => (
              <View key={index} style={styles.productRow}>
                <View style={styles.productRank}><Text style={styles.rankNumber}>#{index + 1}</Text></View>
                <View style={styles.productInfo}><Text style={styles.productName} numberOfLines={1}>{product.name}</Text></View>
                <Text style={styles.productRevenue}>${Number(product.revenue).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {stats.lowStockItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>⚠️ Needs Reordering</Text><Text style={styles.sectionBadge}>{stats.lowStockItems.length}</Text></View>
            {stats.lowStockItems.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.alertItem}>
                <View style={styles.alertInfo}><Text style={styles.alertName} numberOfLines={1}>{item.name}</Text><Text style={styles.alertSku}>SKU: {item.sku}</Text></View>
                <View style={styles.alertQuantity}><Text style={styles.alertQtyNumber}>{item.quantity}</Text><Text style={styles.alertQtyLabel}>left</Text></View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><Text style={styles.logoutText}>Sign Out</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 20 },
  welcomeText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  nameText: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginTop: 4 },
  roleText: { fontSize: 13, color: '#2563eb', fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterContainer: { maxHeight: 40, marginBottom: 20 },
  filterContent: { paddingRight: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  filterTextActive: { color: '#fff' },
  cardsContainer: { marginBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  revenueCard: { borderLeftWidth: 4, borderLeftColor: '#10b981' },
  ordersCard: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  lowStockCard: { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  iconContainer: { width: 50, height: 50, backgroundColor: '#f9fafb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  icon: { fontSize: 24 },
  cardTextContainer: { flex: 1 },
  cardLabel: { fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: '500' },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  chartCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  productRank: { width: 40, alignItems: 'center' },
  rankNumber: { fontSize: 16, fontWeight: 'bold', color: '#6b7280' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  productRevenue: { fontSize: 14, fontWeight: 'bold', color: '#2563eb' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  sectionBadge: { backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  alertItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#f59e0b', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  alertInfo: { flex: 1, marginRight: 12 },
  alertName: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  alertSku: { fontSize: 12, color: '#6b7280' },
  alertQuantity: { alignItems: 'flex-end' },
  alertQtyNumber: { fontSize: 20, fontWeight: 'bold', color: '#ef4444' },
  alertQtyLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  logoutButton: { backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default DashboardScreen;