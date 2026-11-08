import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cartItems: [],

  addToCart: (product) => {
    const currentItems = get().cartItems;
    const existingItem = currentItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // If already in cart, increase quantity
      set({
        cartItems: currentItems.map(item =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        )
      });
    } else {
      // Add new item
      set({ cartItems: [...currentItems, { ...product, cartQuantity: 1 }] });
    }
  },

  removeFromCart: (productId) => {
    set({ cartItems: get().cartItems.filter(item => item.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
    } else {
      set({
        cartItems: get().cartItems.map(item =>
          item.id === productId ? { ...item, cartQuantity: quantity } : item
        )
      });
    }
  },

  clearCart: () => set({ cartItems: [] }),

  getTotal: () => {
    return get().cartItems.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  },

  getItemCount: () => {
    return get().cartItems.reduce((sum, item) => sum + item.cartQuantity, 0);
  }
}));