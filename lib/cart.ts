export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: string;
}

const CART_STORAGE_KEY = 'shoppingCart';

export const cartUtils = {
  getCart: (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const cart = localStorage.getItem(CART_STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return [];
    }
  },

  addToCart: (productId: string, variantId?: string, quantity: number = 1): void => {
    if (typeof window === 'undefined') return;
    try {
      const cart = cartUtils.getCart();
      
      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex(
        item => item.productId === productId && item.variantId === variantId
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.push({
          productId,
          variantId,
          quantity,
          addedAt: new Date().toISOString(),
        });
      }

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  },

  removeFromCart: (productId: string, variantId?: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const cart = cartUtils.getCart();
      const updatedCart = cart.filter(
        item => !(item.productId === productId && item.variantId === variantId)
      );
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  },

  updateQuantity: (productId: string, variantId: string | undefined, quantity: number): void => {
    if (typeof window === 'undefined') return;
    try {
      const cart = cartUtils.getCart();
      const itemIndex = cart.findIndex(
        item => item.productId === productId && item.variantId === variantId
      );

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          cartUtils.removeFromCart(productId, variantId);
        } else {
          cart[itemIndex].quantity = quantity;
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  },

  isInCart: (productId: string, variantId?: string): boolean => {
    const cart = cartUtils.getCart();
    return cart.some(item => item.productId === productId && item.variantId === variantId);
  },

  getCartCount: (): number => {
    const cart = cartUtils.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  getCartItemQuantity: (productId: string, variantId?: string): number => {
    const cart = cartUtils.getCart();
    const item = cart.find(item => item.productId === productId && item.variantId === variantId);
    return item?.quantity || 0;
  },

  clearCart: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },
};

