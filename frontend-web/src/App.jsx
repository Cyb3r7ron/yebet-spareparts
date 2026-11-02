import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Users from './pages/Users';
import Shop from './pages/Shop';
import MyOrders from './pages/MyOrders';
import CreateOrder from './pages/CreateOrder';
import AllOrders from './pages/AllOrders';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';

// 🏠 SMART ROOT REDIRECT
const HomeRedirect = () => {
  const { user, token } = useAuthStore();
  
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/shop" replace />;
};

// 🛡️ PROTECTED ROUTE COMPONENT
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/shop" replace />;
  }
  
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* 1. SMART ROOT REDIRECT */}
          <Route path="/" element={<HomeRedirect />} />

          {/* 2. Public Routes (No Sidebar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* 3. Protected Routes with Sidebar Layout */}
          <Route element={<Layout />}>
            
            {/* ADMIN / MANAGER ONLY ROUTES */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/create-order" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <CreateOrder />
              </ProtectedRoute>
            } />
            <Route path="/all-orders" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <AllOrders />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['ADMIN']}> 
                <Users />
              </ProtectedRoute>
            } />

            {/* SHARED ROUTES (Admins, Managers, and Users) */}
            <Route path="/shop" element={
              <ProtectedRoute allowedRoles={['USER', 'MANAGER', 'ADMIN']}>
                <Shop />
              </ProtectedRoute>
            } />
            
            <Route path="/my-orders" element={
              <ProtectedRoute allowedRoles={['USER', 'MANAGER', 'ADMIN']}>
                <MyOrders />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['USER', 'MANAGER', 'ADMIN']}>
                <Profile />
              </ProtectedRoute>
            } />

          </Route>

          {/* 4. CATCH-ALL 404 ROUTE (Must be last) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;