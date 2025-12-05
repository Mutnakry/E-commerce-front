'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { productsApi, brandsApi, categoriesApi, reviewsApi } from '@/lib/api';
import { Product, Brand, Category, Review } from '@/lib/types';
import { wishlistUtils } from '@/lib/wishlist';
import { cartUtils } from '@/lib/cart';
import BannerShop from '@/components/banner/bannershop';
import Image from 'next/image';

const ITEMS_PER_PAGE = 8;

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showWishlistOnly = searchParams.get('wishlist') === 'true';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productRatings, setProductRatings] = useState<Record<string, number>>({});
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTime, setSearchTime] = useState<number>(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
    setWishlist(wishlistUtils.getWishlist());
    
    const handleWishlistUpdate = () => {
      setWishlist(wishlistUtils.getWishlist());
    };
    
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  // Helper functions
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, brandsData, categoriesData, reviewsData] = await Promise.all([
        productsApi.getProducts().catch(() => []),
        brandsApi.getBrands().catch(() => []),
        categoriesApi.getCategories().catch(() => []),
        reviewsApi.getReviews().catch(() => []),
      ]);
      
      setAllProducts(productsData);
      setProducts(productsData);
      setBrands(brandsData);
      setCategories(categoriesData);
      setReviews(reviewsData);
      
      // Calculate average ratings for each product
      const ratings: Record<string, number> = {};
      const productRatingCounts: Record<string, number> = {};
      
      // Count normalized ratings (1-5) for filter display - dynamically from database
      const normalizedRatingCounts: Record<number, number> = {};
      
      reviewsData.forEach((review) => {
        const productId = review.productId;
        const actualRating = review.rating;
        
        // Normalize rating to 1-5 for product average calculation
        const normalizedRating = Math.min(Math.max(actualRating, 1), 5);
        
        // Count normalized ratings for filter display (1-5 stars)
        normalizedRatingCounts[normalizedRating] = (normalizedRatingCounts[normalizedRating] || 0) + 1;
        
        // Calculate product averages
        if (!ratings[productId]) {
          ratings[productId] = 0;
          productRatingCounts[productId] = 0;
        }
        ratings[productId] += normalizedRating;
        productRatingCounts[productId] += 1;
      });
      
      // Calculate averages
      const averages: Record<string, number> = {};
      Object.keys(ratings).forEach((productId) => {
        averages[productId] = ratings[productId] / productRatingCounts[productId];
      });
      
      setProductRatings(averages);
      setRatingCounts(normalizedRatingCounts);
    } catch (err: any) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const startTime = performance.now();
    let filtered = [...allProducts];

    if (showWishlistOnly) {
      filtered = filtered.filter(product => wishlist.includes(product.id));
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => 
        product.metadata?.categoryId && selectedCategories.includes(product.metadata.categoryId)
      );
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => 
        product.brandId && selectedBrands.includes(product.brandId)
      );
    }

    if (selectedPriceRange !== 'all') {
      const ranges: Record<string, { min: number; max: number }> = {
        '1-10': { min: 1, max: 10 },
        '10-100': { min: 10, max: 100 },
        '100-500': { min: 100, max: 500 },
        '500-1000': { min: 500, max: 1000 },
        '1000+': { min: 1000, max: Infinity },
      };
      const range = ranges[selectedPriceRange];
      if (range) {
        filtered = filtered.filter(product => {
          const priceValue = product.variants && product.variants.length > 0
            ? parseFloat(product.variants[0].price_out_usd || product.variants[0].price_in_usd || '0')
            : parseFloat(product.price || '0');
          return priceValue >= range.min && priceValue <= range.max;
        });
      }
    } else if (priceRange.min > 0 || priceRange.max < 1000) {
      filtered = filtered.filter(product => {
        const priceValue = product.variants && product.variants.length > 0
          ? parseFloat(product.variants[0].price_out_usd || product.variants[0].price_in_usd || '0')
          : parseFloat(product.price || '0');
        return priceValue >= priceRange.min && priceValue <= priceRange.max;
      });
    }

    if (minRating > 0) {
      const productIdsWithRating = reviews
        .filter(review => {
          const normalizedRating = Math.min(Math.max(review.rating, 1), 5);
          return normalizedRating === minRating;
        })
        .map(review => review.productId);
      
      filtered = filtered.filter(product => 
        productIdsWithRating.includes(product.id)
      );
    }

    filtered.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      if (sortBy === 'price') {
        aValue = a.variants && a.variants.length > 0
          ? parseFloat(a.variants[0].price_out_usd || a.variants[0].price_in_usd || '0')
          : parseFloat(a.price || '0');
        bValue = b.variants && b.variants.length > 0
          ? parseFloat(b.variants[0].price_out_usd || b.variants[0].price_in_usd || '0')
          : parseFloat(b.price || '0');
      } else if (sortBy === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [allProducts, wishlist, showWishlistOnly, searchQuery, selectedCategories, selectedBrands, priceRange, selectedPriceRange, minRating, reviews, sortBy, sortOrder]);

  // Calculate search timing
  useEffect(() => {
    if (!loading && !isSearching) {
      const startTime = performance.now();
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const elapsed = Math.round(endTime - startTime);
        setSearchTime(elapsed < 1 ? 1 : elapsed);
      });
    }
  }, [filteredProducts.length, loading, isSearching]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]
    );
    setCurrentPage(1);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
    setCurrentPage(1);
  };

  const handleRemoveFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange({ min: 0, max: 1000 });
    setSelectedPriceRange('all');
    setMinRating(0);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, selectedBrands, priceRange, selectedPriceRange, minRating]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const timeoutId = setTimeout(() => {
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleWishlistToggle = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    wishlistUtils.toggleWishlist(productId);
    setWishlist(wishlistUtils.getWishlist());
  };

  // Get category count
  const getCategoryCount = (categoryId: string): number => {
    return allProducts.filter(p => p.metadata?.categoryId === categoryId).length;
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="flex relative">
        {isFilterOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsFilterOpen(false)}
          />
        )}

        {/* Left Sidebar - Filters */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gray-900 min-h-screen p-4 overflow-y-auto border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${isFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="text-xl font-bold text-white">Filters</h2>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="p-2 hover:bg-gray-800 rounded text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Shop Header */}
          <div className="mb-6 hidden lg:block">
            <h1 className="text-xl font-bold text-white mb-2">Shop</h1>
          </div>

          {/* Search in Sidebar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search Task"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-white text-sm relative placeholder-gray-500"
            />
            {isSearching && (
              <div className="absolute mt-2 right-6">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-6 text-sm text-gray-400">
            {filteredProducts.length} Results Found {searchTime > 0 && <span className="text-green-500">in {searchTime}ms</span>}
          </div>

          <h2 className="text-sm font-semibold text-white mb-4">Filter</h2>

          {/* Price Range - Multi Range */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-white">Multi Range</h3>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All' },
                { value: '1-10', label: '$1 - $10' },
                { value: '10-100', label: '$10 - $100' },
                { value: '100-500', label: '$100 - $500' },
                { value: '500-1000', label: '$500 - $1000' },
                { value: '1000+', label: '$1000+' },
              ].map((range) => (
                <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    value={range.value}
                    checked={selectedPriceRange === range.value}
                    onChange={(e) => setSelectedPriceRange(e.target.value)}
                    className="w-4 h-4 text-green-500"
                  />
                  <span className="text-sm text-gray-300">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Slider */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-white">Price Range</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>${priceRange.min}</span>
                <span>${priceRange.max}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                className="w-full"
              />
              {(priceRange.min > 0 || priceRange.max < 1000) && (
                <button
                  onClick={() => setPriceRange({ min: 0, max: 1000 })}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-white">Category</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((category) => {
                const count = getCategoryCount(category.id);
                return (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-green-500"
                    />
                    <span className="text-sm text-gray-300">{category.name} ({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Brand */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-white">Brand</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {brands.map((brand) => {
                const productCount = allProducts.filter(p => p.brandId === brand.id).length;
                return (
                  <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.id)}
                      onChange={() => handleBrandToggle(brand.id)}
                      className="w-4 h-4 text-green-500"
                    />
                    <span className="text-sm text-gray-300">{brand.name} ({productCount})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-white">Rating</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingCounts[rating] || 0;
                return (
                  <label key={rating} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(minRating === rating ? 0 : rating)}
                      className="w-4 h-4 text-green-500"
                    />
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-600'}>
                          ★
                        </span>
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        ({count})
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Remove Filters Button */}
          <button
            onClick={handleRemoveFilters}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors font-medium"
          >
            Remove Filter
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
             {/* Event Banner */}
             <BannerShop />

          {/* Top Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-green-500">Results</h1>
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 bg-green-900 text-white rounded text-sm font-medium hover:bg-green-800 transition-colors"
                >
                  History
                </button>
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filter</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search Task"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 pr-10 sm:pr-10 border border-gray-700 rounded bg-gray-900 text-white text-sm sm:text-base placeholder-gray-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortBy(by);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 sm:px-4 py-2 border border-gray-700 rounded bg-gray-900 text-white text-sm sm:text-base"
                >
                  <option value="price-asc">Price Low To High</option>
                  <option value="price-desc">Price High To Low</option>
                  <option value="name-asc">Name A to Z</option>
                  <option value="name-desc">Name Z to A</option>
                </select>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

       
          {/* Products Grid/List */}
          {loading || isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No products found</p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {paginatedProducts.map((product) => {
                    const image = getProductImage(product);
                    const price = getProductPrice(product);
                    
                    return (
                      <div
                        key={product.id}
                        className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all"
                      >
                        <div
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="cursor-pointer"
                        >
                          <div className="relative w-full aspect-square mb-4 overflow-hidden bg-gray-800">
                            {image ? (
                              <Image
                                src={image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xl font-bold text-green-500">
                                {parseFloat(price).toLocaleString()}
                              </span>
                            </div>
                            <h3 className="text-white font-semibold text-base mb-2 line-clamp-2">{product.name}</h3>
                          </div>
                        </div>
                        <div className="px-4 pb-4 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWishlistToggle(product.id, e);
                            }}
                            className={`px-4 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                              wishlist.includes(product.id)
                                ? 'bg-purple-700 text-white hover:bg-purple-600'
                                : 'bg-purple-900 text-purple-300 hover:bg-purple-800'
                            }`}
                            aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <svg className="w-4 h-4" fill={wishlist.includes(product.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              {wishlist.includes(product.id) ? (
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              )}
                            </svg>
                            Wish List
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add product to cart (using first variant if available, or no variant)
                              const variantId = product.variants && product.variants.length > 0 
                                ? product.variants[0].id 
                                : undefined;
                              cartUtils.addToCart(product.id, variantId, 1);
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add To Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {paginatedProducts.map((product) => {
                    const image = getProductImage(product);
                    const price = getProductPrice(product);
                    
                    return (
                      <div
                        key={product.id}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-800 hover:border-gray-700 transition-all"
                      >
                        <div 
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="relative w-full sm:w-32 h-48 sm:h-32 rounded-lg overflow-hidden shrink-0 cursor-pointer bg-gray-800"
                        >
                          {image ? (
                            <Image
                              src={image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xl font-bold text-green-500">
                              {parseFloat(price).toLocaleString()}
                            </span>
                          </div>
                          <h3 
                            onClick={() => router.push(`/products/${product.id}`)}
                            className="text-white font-semibold text-base sm:text-lg mb-2 cursor-pointer hover:text-green-500"
                          >
                            {product.name}
                          </h3>
                          {product.shortDesc && (
                            <p className="text-gray-400 text-sm mb-3 sm:mb-4 line-clamp-2">{product.shortDesc}</p>
                          )}
                          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWishlistToggle(product.id, e);
                              }}
                              className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors ${
                                wishlist.includes(product.id)
                                  ? 'bg-purple-700 text-white hover:bg-purple-600'
                                  : 'bg-purple-900 text-purple-300 hover:bg-purple-800'
                              }`}
                            >
                              <svg className="w-4 h-4" fill={wishlist.includes(product.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                {wishlist.includes(product.id) ? (
                                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                )}
                              </svg>
                              Wish List
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add product to cart (using first variant if available, or no variant)
                                const variantId = product.variants && product.variants.length > 0 
                                  ? product.variants[0].id 
                                  : undefined;
                                cartUtils.addToCart(product.id, variantId, 1);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Add To Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-3 sm:gap-2 mt-6 sm:mt-8">
                  <span className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1 sm:mr-4">
                    {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded flex items-center justify-center border transition-colors ${
                        currentPage === 1
                          ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                          : 'border-green-500 text-green-500 hover:bg-green-900 cursor-pointer'
                      }`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {getPageNumbers().map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="text-gray-500 px-1 sm:px-2 text-xs sm:text-sm">
                            ...
                          </span>
                        );
                      }

                      const pageNum = page as number;
                      const isActive = pageNum === currentPage;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded flex items-center justify-center transition-colors text-xs sm:text-sm border ${
                            isActive
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded flex items-center justify-center border transition-colors ${
                        currentPage === totalPages
                          ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                          : 'border-gray-700 text-gray-300 hover:bg-gray-800 cursor-pointer'
                      }`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
        <Footer />
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  );

}
