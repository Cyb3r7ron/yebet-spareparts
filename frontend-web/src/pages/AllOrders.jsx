import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

const AllOrders = () => {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 1. Move fetchOrders INSIDE useEffect to satisfy the strict linter
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/api/orders', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setOrders(res.data.orders);
      } catch (error) {
        // 2. Actually use the 'error' variable so the linter doesn't complain
        console.error('Failed to load orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [token]);

  const handleConfirmOrder = async (orderId) => {
    try {
      const response = await axios.patch(`/api/orders/${orderId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(response.data.message);
      
      // Update local state instantly
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'PAID' } : order
      ));
      
      // If the modal is open, update it too
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'PAID' });
      }
    } catch (error) {
      console.error('Failed to confirm order:', error);
      toast.error(error.response?.data?.error || 'Failed to confirm order');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">All Orders History</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Total Orders: {orders.length}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <p className="text-gray-500 text-lg">No orders have been placed yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      #{order.id.substring(order.id.length - 6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {order.user?.firstName} {order.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{order.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        order.orderType === 'IN_PERSON' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.orderType === 'IN_PERSON' ? '🏪 In-Person' : '💻 Online'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleConfirmOrder(order.id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          Confirm Payment
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Order Details #{selectedOrder.id.substring(selectedOrder.id.length - 6).toUpperCase()}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-semibold text-gray-800">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block mt-1 text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-bold text-gray-800 mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{item.product?.name}</p>
                        <p className="text-xs text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">${selectedOrder.totalAmount.toFixed(2)}</span>
              </div>

              {/* Confirm Button inside Modal too */}
              {selectedOrder.status === 'PENDING' && (
                <button
                  onClick={() => handleConfirmOrder(selectedOrder.id)}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md"
                >
                  ✅ Confirm Payment & Record Sale
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;