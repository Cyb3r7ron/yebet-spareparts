import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { token } = useAuthStore();

  const [formData, setFormData] = useState({
    id: '', name: '', sku: '', category: '', price: '', quantity: '', minStock: '5', imageUrl: '', description: ''
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products', { headers: { Authorization: `Bearer ${token}` } });
        setProducts(response.data.products);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [token]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '', sku: '', category: '', price: '', quantity: '', minStock: '5', imageUrl: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setIsEditing(true);
    setFormData({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      minStock: product.minStock.toString(),
      imageUrl: product.imageUrl || '',
      description: product.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await axios.delete(`/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Product deleted!');
      setProducts(products.filter(p => p.id !== id));
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/products/${formData.id}` : '/api/products';
      const method = isEditing ? 'put' : 'post';
      
      const response = await axios[method](url, {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        minStock: parseInt(formData.minStock)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success(isEditing ? 'Product updated!' : 'Product added!');
      
      if (isEditing) {
        setProducts(products.map(p => p.id === formData.id ? response.data.product : p));
      } else {
        setProducts([response.data.product, ...products]);
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <div className="flex gap-3 w-full md:w-auto">
          <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 md:w-64 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition">+ Add Product</button>
        </div>
      </div>

      {loading ? <div className="text-center py-20 text-gray-500">Loading...</div> : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm"><p className="text-gray-500 text-lg">No products found.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative group">
              {/* Action Buttons (Visible on Hover) */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(product)} className="bg-white text-blue-600 p-2 rounded-full shadow-md hover:bg-blue-50 text-xs">✏️</button>
                <button onClick={() => handleDelete(product.id, product.name)} className="bg-white text-red-600 p-2 rounded-full shadow-md hover:bg-red-50 text-xs">🗑️</button>
              </div>

              <div className="h-40 bg-gray-200 flex items-center justify-center text-4xl rounded-t-2xl overflow-hidden">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : '🔧'}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{product.category}</span>
                  {product.isSoldOut ? <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Sold Out</span> : <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">In Stock</span>}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-4">SKU: {product.sku}</p>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">Qty: {product.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal (Handles both Add and Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU</label><input name="sku" required value={formData.sku} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><input name="category" required value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Price</label><input name="price" type="number" step="0.01" required value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label><input name="quantity" type="number" required value={formData.quantity} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label><input name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." /></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">{isEditing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;