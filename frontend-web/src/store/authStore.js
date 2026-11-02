import { create } from 'zustand';
import axios from 'axios';

// Set default base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5173'; 

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,

  login: async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      
      // Save token and full user object (including avatarUrl) to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); 
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Login failed' };
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get('/api/auth/me');
      
      // Update localStorage with the fresh user data from backend
      localStorage.setItem('user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token });
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      set({ user: null, token: null });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },

  updateUser: (newUserData) => {
    const updatedUser = { ...get().user, ...newUserData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  }
}));