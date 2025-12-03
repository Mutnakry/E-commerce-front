'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { productsApi, reviewsApi } from '@/lib/api';
import { Product, ProductVariant, Review } from '@/lib/types';
import { cartUtils, CartItem } from '@/lib/cart';
import { wishlistUtils } from '@/lib/wishlist';
import Image from 'next/image';

interface CartItemWithProduct extends CartItem {
  product: Product;
  variant?: ProductVariant;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productRatings, setProductRatings] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCartItems();
    loadWishlist();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartItems();
    };
    
    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      loadWishlist();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  const loadWishlist = () => {
    setWishlist(wishlistUtils.getWishlist());
  };

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const cart = cartUtils.getCart();
      
      if (cart.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // Fetch all products and reviews
      const [allProducts, reviewsData] = await Promise.all([
        productsApi.getProducts(),
        reviewsApi.getReviews().catch(() => []),
      ]);
      
      setReviews(reviewsData);
      
      // Calculate average ratings for products
      const ratings: Record<string, number> = {};
      const reviewCounts: Record<string, number> = {};
      
      reviewsData.forEach((review) => {
        const productId = review.productId;
        const normalizedRating = Math.min(Math.max(review.rating, 1), 5);
        
        if (!ratings[productId]) {
          ratings[productId] = 0;
          reviewCounts[productId] = 0;
        }
        ratings[productId] += normalizedRating;
        reviewCounts[productId] += 1;
      });
      
      const averages: Record<string, number> = {};
      Object.keys(ratings).forEach((productId) => {
        averages[productId] = ratings[productId] / reviewCounts[productId];
      });
      
      setProductRatings(averages);
      
      // Map cart items with product data
      const itemsWithProducts: CartItemWithProduct[] = cart.map(cartItem => {
        const product = allProducts.find(p => p.id === cartItem.productId);
        const variant = product?.variants?.find(v => v.id === cartItem.variantId);
        
        return {
          ...cartItem,
          product: product!,
          variant,
        };
      }).filter(item => item.product); // Filter out items where product wasn't found

      setCartItems(itemsWithProducts);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (item: CartItemWithProduct): string | null => {
    if (item.variant?.images && item.variant.images.length > 0) {
      return item.variant.images[0];
    }
    if (item.product.images && item.product.images.length > 0) {
      return item.product.images[0];
    }
    return null;
  };

  const getProductPrice = (item: CartItemWithProduct): string => {
    if (item.variant) {
      return item.variant.price_out_usd || item.variant.price_in_usd || '0';
    }
    return item.product.price || '0';
  };

  const getTotalPrice = (): number => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(getProductPrice(item));
      return total + (price * item.quantity);
    }, 0);
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, newQuantity: number) => {
    if (newQuantity <= 0) {
      cartUtils.removeFromCart(productId, variantId);
    } else {
      cartUtils.updateQuantity(productId, variantId, newQuantity);
    }
    // fetchCartItems will be called automatically via the event listener
  };

  const handleRemoveItem = (productId: string, variantId: string | undefined) => {
    cartUtils.removeFromCart(productId, variantId);
    // fetchCartItems will be called automatically via the event listener
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-500 mb-2">Shopping Cart</h1>
          <p className="text-gray-400">Review your items before checkout</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
            <button
              onClick={() => router.push('/shop')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const image = getProductImage(item);
                const price = getProductPrice(item);
                const itemTotal = parseFloat(price) * item.quantity;

                return (
                  <div
                    key={`${item.productId}-${item.variantId || 'no-variant'}`}
                    className="bg-gray-900 rounded-lg border border-gray-800 p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div
                        onClick={() => router.push(`/products/${item.productId}`)}
                        className="relative w-full sm:w-32 h-48 sm:h-32 rounded-lg overflow-hidden bg-gray-800 shrink-0 cursor-pointer"
                      >
                        {image ? (
                          <Image
                            src={image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3
                          onClick={() => router.push(`/products/${item.productId}`)}
                          className="text-white font-semibold text-lg mb-2 cursor-pointer hover:text-green-500 transition-colors"
                        >
                          {item.product.name}
                        </h3>
                        {item.variant && (
                          <p className="text-gray-400 text-sm mb-2">{item.variant.title}</p>
                        )}
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-500 font-bold text-lg">
                            {parseFloat(price).toLocaleString()}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center justify-center"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center justify-center"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-white font-bold text-lg">
                              <svg className="w-5 h-5 text-green-500 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                              </svg>
                              {itemTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.productId, item.variantId)}
                          className="mt-4 text-red-400 hover:text-red-300 text-sm transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 sticky top-4">
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="text-white font-semibold">
                      <svg className="w-4 h-4 text-green-500 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      {getTotalPrice().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className="text-white font-semibold">Free</span>
                  </div>
                  <div className="border-t border-gray-800 pt-4 flex justify-between">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className="text-green-500 font-bold text-lg">
                      <svg className="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      {getTotalPrice().toLocaleString()}
                    </span>
                  </div>
                </div>

                <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold mb-4">
                  Proceed to Checkout
                </button>
                
                <button
                  onClick={() => router.push('/shop')}
                  className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

