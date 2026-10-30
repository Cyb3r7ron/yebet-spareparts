import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

const Shop = () => {
  const { token } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch products on load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setProducts(res.data.products);
      // eslint-disable-next-line no-unused-vars
      } catch (_error) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [token]);

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add to cart
  const addToCart = (product) => {
    if (product.quantity <= 0) {
      toast.warning('This item is sold out!');
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.warning(`Only ${product.quantity} items left in stock!`);
        return;
      }
      setCart(cart.map((item) => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Update cart quantity
  const updateQuantity = (productId, delta) => {
    setCart(cart.map((item) => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null; // Remove from cart
        
        // Check against actual stock
        const originalProduct = products.find(p => p.id === productId);
        if (originalProduct && newQty > originalProduct.quantity) {
          toast.warning(`Only ${originalProduct.quantity} items left in stock!`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  // Place Order
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity
      }));

      await axios.post('/api/orders', { items: orderItems }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Order placed successfully!');
      setCart([]); // Clear cart
      
      // Refresh products to update stock levels
      const res = await axios.get('/api/products', { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data.products);
      
    } catch (_error) {
      console.error('Checkout error:', _error);
      toast.error(_error.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* LEFT SIDE: Product Catalog */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search products by name, category, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading shop...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl text-gray-500">No products found matching your search.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isSoldOut = product.quantity <= 0 || product.isSoldOut;
                const cartItem = cart.find(c => c.id === product.id);
                
                return (
                  <div key={product.id} className={`bg-white p-4 rounded-xl shadow-sm border transition flex flex-col ${isSoldOut ? 'opacity-60 border-red-100 bg-red-50' : 'border-gray-100 hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{product.category}</span>
                      {isSoldOut ? (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">SOLD OUT</span>
                      ) : (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">In Stock: {product.quantity}</span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">SKU: {product.sku}</p>
                    
                    <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={isSoldOut}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          isSoldOut 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {cartItem ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Shopping Cart */}
      <div className="w-full lg:w-80 bg-white rounded-2xl shadow-lg flex flex-col h-full border border-gray-100">
        <div className="p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
          <p className="text-sm text-gray-500">{cart.length} item(s)</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">🛒</p>
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex-1 pr-2">
                  <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 bg-white border rounded flex items-center justify-center text-gray-600 hover:bg-gray-100">-</button>
                  <span className="font-bold text-gray-800 w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 bg-white border rounded flex items-center justify-center text-gray-600 hover:bg-gray-100">+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-medium">Total:</span>
            <span className="text-2xl font-bold text-blue-600">${totalAmount.toFixed(2)}</span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={submitting || cart.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-md"
          >
            {submitting ? 'Processing...' : '✅ Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Shop;