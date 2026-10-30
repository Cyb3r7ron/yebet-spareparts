import { create } from 'zustand';
import axios from 'axios';

// Create axios instance to talk to our backend
const api = axios.create({
  baseURL: '/api', 
});

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Save to browser memory
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Set auth header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({ user, token });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed' 
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },
  
  updateUser: (newUserData) => {
    const updatedUser = { ...useAuthStore.getState().user, ...newUserData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}));