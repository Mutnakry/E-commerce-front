'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { Product } from '@/lib/types';
import Image from 'next/image';

interface SearchProductProps {
  onProductClick?: () => void;
}

export default function SearchProduct({ onProductClick }: SearchProductProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    const debounceTimer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const results = await productsApi.getProducts({
          search: searchQuery,
          limit: 10, // Limit to 10 results for dropdown
        });
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  const handleProductClick = (productId: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    if (onProductClick) {
      onProductClick();
    }
    router.push(`/products/${productId}`);
  };

  const getProductImage = (product: Product): string | null => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    if (product.variants && product.variants[0]?.images && product.variants[0].images.length > 0) {
      return product.variants[0].images[0];
    }
    return null;
  };

  const getProductPrice = (product: Product): string => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].price_out_usd || product.variants[0].price_in_usd || '0';
    }
    return product.price || '0';
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-800 rounded-lg w-full">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search items"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0 || searchQuery.trim()) {
              setShowDropdown(true);
            }
          }}
          className="bg-transparent text-white placeholder-gray-400 outline-none flex-1 min-w-0"
        />
        {isSearching && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <>
          {/* Mobile: Full screen overlay */}
          <div className="md:hidden fixed top-[80px] left-0 right-0 bottom-0 bg-gray-800 shadow-xl border-t border-gray-700 z-50 overflow-y-auto search-dropdown-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : searchResults.length === 0 && searchQuery.trim() ? (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-400 text-sm">No products found</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((product) => {
                  const productImage = getProductImage(product);
                  const productPrice = getProductPrice(product);

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                    >
                      {/* Product Image */}
                      <div className="relative w-16 h-16 bg-gray-700 rounded-lg overflow-hidden shrink-0">
                        {productImage ? (
                          <Image
                            src={productImage}
                            alt={product.name || 'Product'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {product.name || 'Unnamed Product'}
                        </p>
                        {product.shortDesc && (
                          <p className="text-gray-400 text-xs truncate mt-1">
                            {product.shortDesc}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-500 text-sm font-semibold">
                            ${parseFloat(productPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          {/* Desktop: Dropdown */}
          <div className="hidden md:block absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-[500px] overflow-y-auto search-dropdown-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : searchResults.length === 0 && searchQuery.trim() ? (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-400 text-sm">No products found</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((product) => {
                const productImage = getProductImage(product);
                const productPrice = getProductPrice(product);

                return (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                  >
                    {/* Product Image */}
                    <div className="relative w-16 h-16 bg-gray-700 rounded-lg overflow-hidden shrink-0">
                      {productImage ? (
                        <Image
                          src={productImage}
                          alt={product.name || 'Product'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {product.name || 'Unnamed Product'}
                      </p>
                      {product.shortDesc && (
                        <p className="text-gray-400 text-xs truncate mt-1">
                          {product.shortDesc}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-500 text-sm font-semibold">
                          ${parseFloat(productPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
          </div>
        </>
      )}
    </div>
  );
}

