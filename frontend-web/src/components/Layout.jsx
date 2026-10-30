import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';

// Helper to ensure image URLs are always correct
const getAvatarUrl = (user) => {
  if (user?.avatarUrl) {
    // If it's a relative path from backend, ensure it has the backend URL
    return user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`;
  }
  // Fallback to a nice generated avatar with their initials
  return `https://ui-avatars.com/api/?name=${user?.firstName || 'U'}+${user?.lastName || ''}&background=3b82f6&color=fff&size=128`;
};

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const avatarUrl = getAvatarUrl(user);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const navLinks = isAdmin ? [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Inventory', icon: '🔧' },
    { path: '/create-order', label: 'Place Order', icon: '🛒' },
    { path: '/all-orders', label: 'All Orders', icon: '📦' },
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/profile', label: 'My Profile', icon: '⚙️' },
  ] : [
    { path: '/shop', label: 'Shop', icon: '🛒' },
    { path: '/my-orders', label: 'My Orders', icon: '📜' },
    { path: '/profile', label: 'My Profile', icon: '⚙️' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🚗 Yebet<span className="text-blue-500">Parts</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin ? 'Admin Panel' : 'Customer Portal'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-xl">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            {/* Sidebar Avatar (Small) */}
            <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-gray-700" />
            <div>
              <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar with LARGE Avatar */}
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {isAdmin ? 'Admin Dashboard' : 'Customer Portal'}
          </h2>
          
          {/* 👇 NEW HEADER PROFILE SECTION 👇 */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Welcome back,</p>
              <p className="font-bold text-gray-800">{user?.firstName} {user?.lastName}</p>
            </div>
            <img 
              src={avatarUrl} 
              alt="Profile" 
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shadow-md" 
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;