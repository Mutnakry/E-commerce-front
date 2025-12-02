import { Product } from './types';

const WISHLIST_STORAGE_KEY = 'wishlist';

export const wishlistUtils = {
  getWishlist: (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return wishlist ? JSON.parse(wishlist) : [];
    } catch (error) {
      console.error('Error reading wishlist from localStorage:', error);
      return [];
    }
  },

  addToWishlist: (productId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const wishlist = wishlistUtils.getWishlist();
      if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  },

  removeFromWishlist: (productId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const wishlist = wishlistUtils.getWishlist();
      const updatedWishlist = wishlist.filter(id => id !== productId);
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updatedWishlist));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  },

  toggleWishlist: (productId: string): boolean => {
    if (typeof window === 'undefined') return false;
    const wishlist = wishlistUtils.getWishlist();
    if (wishlist.includes(productId)) {
      wishlistUtils.removeFromWishlist(productId);
      return false;
    } else {
      wishlistUtils.addToWishlist(productId);
      return true;
    }
  },

  isInWishlist: (productId: string): boolean => {
    const wishlist = wishlistUtils.getWishlist();
    return wishlist.includes(productId);
  },

  getWishlistCount: (): number => {
    return wishlistUtils.getWishlist().length;
  },
};

