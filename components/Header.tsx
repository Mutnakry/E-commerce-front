'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from './modale/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { wishlistUtils } from '@/lib/wishlist';
import { cartUtils } from '@/lib/cart';
import SearchProduct from './product/searchproduct';
import Image from 'next/image';

export default function Header() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLoginSuccess = () => {
    // User is already updated in context
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Load wishlist count and listen for updates
  useEffect(() => {
    const updateWishlistCount = () => {
      setWishlistCount(wishlistUtils.getWishlistCount());
    };

    updateWishlistCount();
    window.addEventListener('wishlistUpdated', updateWishlistCount);

    return () => {
      window.removeEventListener('wishlistUpdated', updateWishlistCount);
    };
  }, []);

  // Load cart count and listen for updates
  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(cartUtils.getCartCount());
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  return (
    <>
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              {/* Hamburger Menu Button - Mobile Only */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              <div className="text-green-500 text-xl md:text-2xl font-bold">
                <span className="md:hidden">E</span>
                <span className="hidden md:inline">Ecommerce</span>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Products
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Blind Box Battle
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Free Skins
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Lucky charms
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Accessories Mall
                </a>
              </nav>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Search Bar - Desktop Only */}
              <div className="hidden md:block">
                <SearchProduct />
              </div>

              {/* Search - Mobile Only */}
              <div className="md:hidden">
                <SearchProduct />
              </div>

              {user ? (
                <div className="flex items-center gap-2 md:gap-4">
                  {/* Wishlist Button - Desktop Only */}
                  <button
                    onClick={() => router.push('/wishlist')}
                    className="hidden md:block relative text-gray-300 hover:text-red-500 transition-colors"
                    aria-label="Wishlist"
                  >
                    <svg className="w-6 h-6" fill={wishlistCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlistCount > 9 ? '9+' : wishlistCount}
                      </span>
                    )}
                  </button>

                  {/* Wishlist Button - Mobile Only */}
                  <button
                    onClick={() => router.push('/wishlist')}
                    className="md:hidden relative text-gray-300 hover:text-red-500 transition-colors"
                    aria-label="Wishlist"
                  >
                    <svg className="w-5 h-5" fill={wishlistCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {wishlistCount > 9 ? '9+' : wishlistCount}
                      </span>
                    )}
                  </button>

                  {/* Shopping Cart - Desktop Only */}
                  <button
                    onClick={() => router.push('/cart')}
                    className="hidden md:block relative text-gray-300 hover:text-white transition-colors"
                    aria-label="Shopping Cart"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Shopping Cart - Mobile Only */}
                  <button
                    onClick={() => router.push('/cart')}
                    className="md:hidden relative text-gray-300 hover:text-white transition-colors"
                    aria-label="Shopping Cart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        {user.profileImage ? (
                          <Image
                            src={user.profileImage}
                            alt={user.username || user.email}
                            width={32}
                            height={32}
                            className="rounded-full cursor-pointer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold cursor-pointer">
                            {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-white font-medium hidden md:block">
                          {user.username || user.email}
                        </span>
                      </button>

                      {/* Dropdown Menu */}
                      {isProfileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-w-[calc(100vw-2rem)]">
                          <div className="p-4 border-b border-gray-700">
                            <p className="text-white font-semibold text-sm">{user.username || user.email}</p>
                            {user.role && (
                              <p className="text-gray-400 text-xs mt-1">{user.role}</p>
                            )}
                          </div>
                          
                          <div className="p-4 space-y-3">
                            {user.email && (
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-gray-400 text-xs">Email</p>
                                  <p className="text-white text-sm">{user.email}</p>
                                </div>
                              </div>
                            )}

                            {user.phoneNumber && (
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-gray-400 text-xs">Phone Number</p>
                                  <p className="text-white text-sm">{user.phoneNumber}</p>
                                </div>
                              </div>
                            )}

                            {user.walletCurrency && (
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-gray-400 text-xs">Balance</p>
                                  <p className="text-white text-sm font-semibold">
                                    {user.balance ? (
                                      <>
                                        {parseFloat(user.balance).toLocaleString()} {user.walletCurrency}
                                      </>
                                    ) : (
                                      `0 ${user.walletCurrency}`
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-2 border-t border-gray-700">
                            <button
                              onClick={() => {
                                setIsProfileDropdownOpen(false);
                                logout();
                              }}
                              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-green-500 text-white text-sm md:text-base rounded-lg hover:bg-green-600 transition-colors"
                >
                  <span className="hidden sm:inline">Login / Register</span>
                  <span className="sm:hidden">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay & Sidebar */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Sidebar */}
            <div
              ref={mobileMenuRef}
              className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50 md:hidden transform transition-transform duration-300 ease-in-out translate-x-0"
            >
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <div className="text-green-500 text-xl font-bold">Ecommerce</div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                  <a
                    href="#"
                    className="block text-gray-300 hover:text-white hover:bg-gray-800 transition-colors py-3 px-3 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Products
                  </a>
                  <a
                    href="#"
                    className="block text-gray-300 hover:text-white hover:bg-gray-800 transition-colors py-3 px-3 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Blind Box Battle
                  </a>
                  <a
                    href="#"
                    className="block text-gray-300 hover:text-white hover:bg-gray-800 transition-colors py-3 px-3 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Free Skins
                  </a>
                  <a
                    href="#"
                    className="block text-gray-300 hover:text-white hover:bg-gray-800 transition-colors py-3 px-3 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Lucky charms
                  </a>
                  <a
                    href="#"
                    className="block text-gray-300 hover:text-white hover:bg-gray-800 transition-colors py-3 px-3 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Accessories Mall
                  </a>
                </nav>

                {/* Search Section */}
                <div className="p-4 border-t border-gray-800">
                  <SearchProduct onProductClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}

