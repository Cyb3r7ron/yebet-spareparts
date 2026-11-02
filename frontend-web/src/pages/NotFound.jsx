import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const NotFound = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const handleGoHome = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-black text-blue-600 opacity-20">404</h1>
        <div className="relative -mt-16">
          <span className="text-8xl">🔧</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Page Not Found</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <button
          onClick={handleGoHome}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition shadow-lg flex items-center gap-2 mx-auto"
        >
          <span>←</span> Go Back Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;