import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { downloadCSV } from '../utils/exportCSV';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Helper to get default date ranges
const getDateRange = (range) => {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case 'last7': start.setDate(end.getDate() - 7); break;
    case 'last30': start.setDate(end.getDate() - 30); break;
    case 'last90': start.setDate(end.getDate() - 90); break;
    case 'thisYear': start.setFullYear(end.getFullYear(), 0, 1); break;
    default: break;
  }
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

const Dashboard = () => {
  const { token } = useAuthStore();
  const location = useLocation();
  
  const [dateRange, setDateRange] = useState('last30');
  const [startDate, setStartDate] = useState(getDateRange('last30').start);
  const [endDate, setEndDate] = useState(getDateRange('last30').end);
  const [showCustom, setShowCustom] = useState(false);
  
  const [data, setData] = useState({ summary: { totalRevenue: 0, totalItems: 0, totalTransactions: 0 }, salesData: [] });
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // Fetch data whenever dates change
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Sales Data with specific dates
        const salesResponse = await axios.get(`/api/sales?startDate=${startDate}&endDate=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(salesResponse.data);

        // 2. Fetch Products to check for Low Stock
        const productsResponse = await axios.get('/api/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const lowStock = productsResponse.data.products.filter(
          (p) => p.quantity <= (p.minStock || 5) && p.quantity > 0
        );
        setLowStockProducts(lowStock);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, [startDate, endDate, location.pathname, token]);

  // Handle preset button clicks
  const handlePresetChange = (preset) => {
    setDateRange(preset);
    setShowCustom(false);
    const dates = getDateRange(preset);
    setStartDate(dates.start);
    setEndDate(dates.end);
  };

  // Prepare data for Pie Chart
  const pieData = data.salesData.reduce((acc, sale) => {
    const existing = acc.find(item => item.name === sale.productName);
    if (existing) existing.value += sale.totalAmount;
    else acc.push({ name: sale.productName, value: sale.totalAmount });
    return acc;
  }, []);

  const topProducts = [...pieData].sort((a, b) => b.value - a.value).slice(0, 5);

  // Prepare data for Bar Chart (Grouped by Day)
  const timeGroupedData = data.salesData.reduce((acc, sale) => {
    const dateKey = new Date(sale.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.name === dateKey);
    if (existing) {
      existing.sales += sale.totalAmount;
    } else {
      acc.push({ name: dateKey, sales: sale.totalAmount });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Date Range Selector & Export */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handlePresetChange('last7')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${dateRange === 'last7' && !showCustom ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Last 7 Days</button>
            <button onClick={() => handlePresetChange('last30')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${dateRange === 'last30' && !showCustom ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Last 30 Days</button>
            <button onClick={() => handlePresetChange('last90')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${dateRange === 'last90' && !showCustom ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Last 90 Days</button>
            <button onClick={() => handlePresetChange('thisYear')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${dateRange === 'thisYear' && !showCustom ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>This Year</button>
            <button onClick={() => setShowCustom(!showCustom)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${showCustom ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Custom Range</button>
          </div>

          {showCustom && (
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setDateRange('custom'); }} className="px-3 py-1 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-gray-500 text-sm">to</span>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setDateRange('custom'); }} className="px-3 py-1 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <button 
            onClick={() => {
              const exportData = data.salesData.map(sale => ({
                Date: new Date(sale.saleDate).toISOString().split('T')[0],
                Product: sale.productName,
                Quantity: sale.quantity,
                Revenue: sale.totalAmount
              }));

              const totalQuantity = exportData.reduce((sum, item) => sum + Number(item.Quantity), 0);
              const totalRevenue = exportData.reduce((sum, item) => sum + Number(item.Revenue), 0);

              exportData.push({ Date: 'TOTAL', Product: '---', Quantity: totalQuantity, Revenue: totalRevenue });
              downloadCSV(exportData, `sales_report_${startDate}_to_${endDate}`);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2 shadow-md whitespace-nowrap"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-medium opacity-90">Total Revenue</h3>
          <p className="text-4xl font-bold mt-2">${data.summary.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-medium opacity-90">Items Sold</h3>
          <p className="text-4xl font-bold mt-2">{data.summary.totalItems.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-medium opacity-90">Transactions</h3>
          <p className="text-4xl font-bold mt-2">{data.summary.totalTransactions.toLocaleString()}</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚠️</span>
            <h2 className="text-xl font-bold text-red-800">Low Stock Alerts</h2>
            <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
              {lowStockProducts.length} item(s) need reordering
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{product.quantity}</p>
                  <p className="text-xs text-gray-500">left in stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue by Product</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">No sales data for this period</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Sales Over Time</h2>
          {timeGroupedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeGroupedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#1f2937' }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">No sales data for this period</div>
          )}
        </div>
      </div>

      {/* Top Selling Products List */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Top Selling Products</h2>
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{product.name}</p>
                    <p className="text-sm text-gray-500">Total Revenue Generated</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">${product.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">No top products for this period yet.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;