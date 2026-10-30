import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const { token } = useAuthStore();
  const location = useLocation();
  
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState({ summary: { totalRevenue: 0, totalItems: 0, totalTransactions: 0 }, salesData: [] });

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await axios.get(`/api/sales?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching sales:', error);
      }
    };
    fetchSales();
  }, [period, location.pathname, token]);

  // Prepare data for Pie Chart (Sales by Product)
  const pieData = data.salesData.reduce((acc, sale) => {
    const existing = acc.find(item => item.name === sale.productName);
    if (existing) existing.value += sale.totalAmount;
    else acc.push({ name: sale.productName, value: sale.totalAmount });
    return acc;
  }, []);

  // Sort and get Top 5 Products for the list below
  const topProducts = [...pieData].sort((a, b) => b.value - a.value).slice(0, 5);

  // Helper to format dates for the Bar Chart X-Axis
  const formatDate = (dateString, currentPeriod) => {
    const date = new Date(dateString);
    if (currentPeriod === 'daily') {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (currentPeriod === 'monthly') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      return date.getFullYear().toString();
    }
  };

  // Prepare data for Bar Chart (Sales over Time)
  const timeGroupedData = data.salesData.reduce((acc, sale) => {
    const dateKey = formatDate(sale.saleDate, period);
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
      {/* Period Selector */}
      <div className="flex gap-4">
        {['daily', 'monthly', 'yearly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-6 py-2 rounded-lg font-semibold transition capitalize ${
              period === p ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-medium opacity-90">Total Revenue</h3>
          <p className="text-4xl font-bold mt-2">${data.summary.totalRevenue}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-medium opacity-90">Items Sold</h3>
          <p className="text-4xl font-bold mt-2">{data.summary.totalItems}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-medium opacity-90">Transactions</h3>
          <p className="text-4xl font-bold mt-2">{data.summary.totalTransactions}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
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

        {/* Bar Chart with BOLD Dates */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Sales Over Time ({period})</h2>
          {timeGroupedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeGroupedData}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* BOLD AND LARGER TEXT FOR DATES */}
                <XAxis 
                  dataKey="name" 
                  angle={-15} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fontSize: 13, fontWeight: 'bold', fill: '#1f2937' }} 
                />
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

      {/* NEW: Top Selling Products List */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Top Selling Products ({period})</h2>
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
                  <p className="text-xl font-bold text-green-600">${product.value.toFixed(2)}</p>
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