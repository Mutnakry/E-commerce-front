'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { productsApi, brandsApi, categoriesApi, reviewsApi } from '@/lib/api';
import { Product, Brand, Category, Review } from '@/lib/types';
import { wishlistUtils } from '@/lib/wishlist';
import Image from 'next/image';

const ITEMS_PER_PAGE = 10;

export default function ShopPage() {
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
  const [allRatings, setAllRatings] = useState<number[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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
    // Load wishlist from localStorage
    setWishlist(wishlistUtils.getWishlist());
    
    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      setWishlist(wishlistUtils.getWishlist());
    };
    
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

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
      
      // Count reviews by actual rating value from database
      const reviewCountsByRating: Record<number, number> = {};
      const uniqueRatings = new Set<number>();
      
      reviewsData.forEach((review) => {
        const productId = review.productId;
        const actualRating = review.rating;
        
        // Track all unique ratings from database
        uniqueRatings.add(actualRating);
        
        // Count reviews by actual rating value
        reviewCountsByRating[actualRating] = (reviewCountsByRating[actualRating] || 0) + 1;
        
        // Normalize rating to 1-5 for product average calculation
        const normalizedRating = Math.min(Math.max(actualRating, 1), 5);
        
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
      
      // Sort ratings in descending order (5, 4, 3, 2, 1, then any others)
      const sortedRatings = Array.from(uniqueRatings).sort((a, b) => b - a);
      
      setProductRatings(averages);
      setRatingCounts(reviewCountsByRating);
      setAllRatings(sortedRatings);
    } catch (err: any) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Wishlist filter
    if (showWishlistOnly) {
      filtered = filtered.filter(product => wishlist.includes(product.id));
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.metadata?.categoryId === selectedCategory);
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => 
        product.brandId && selectedBrands.includes(product.brandId)
      );
    }

    // Price filter
    if (selectedPriceRange !== 'all') {
      const ranges: Record<string, { min: number; max: number }> = {
        'under10': { min: 0, max: 10 },
        '10-100': { min: 10, max: 100 },
        '100-500': { min: 100, max: 500 },
        'over500': { min: 500, max: Infinity },
      };
      const range = ranges[selectedPriceRange];
      if (range) {
        filtered = filtered.filter(product => {
          const price = parseFloat(product.price || '0');
          return price >= range.min && price <= range.max;
        });
      }
    } else if (priceRange.min > 0 || priceRange.max < 1000) {
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price || '0');
        return price >= priceRange.min && price <= priceRange.max;
      });
    }

    // Rating filter
    if (minRating > 0) {
      // Get all reviews with the selected rating
      const productIdsWithRating = reviews
        .filter(review => review.rating === minRating)
        .map(review => review.productId);
      
      // Filter products that have at least one review with the selected rating
      filtered = filtered.filter(product => 
        productIdsWithRating.includes(product.id)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      if (sortBy === 'price') {
        aValue = parseFloat(a.price || '0');
        bValue = parseFloat(b.price || '0');
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
  }, [allProducts, wishlist, showWishlistOnly, searchQuery, selectedCategory, selectedBrands, priceRange, selectedPriceRange, minRating, reviews, sortBy, sortOrder]);

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

  const handleRemoveFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrands, priceRange, selectedPriceRange, minRating]);

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

  const handleWishlistToggle = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    wishlistUtils.toggleWishlist(productId);
    setWishlist(wishlistUtils.getWishlist());
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <div className="flex relative">
        {/* Mobile Filter Overlay */}
        {isFilterOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsFilterOpen(false)}
          />
        )}

        {/* Left Sidebar - Filters */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gray-800 min-h-screen p-4 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${isFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="text-xl font-bold">Filters</h2>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-bold mb-4 hidden lg:block">Filters</h2>
          <h2 className="text-xl font-bold mb-4">Filters</h2>

          {/* Price Range - Multi Range */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Multi Range</h3>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'under10', label: '< $10' },
                { value: '10-100', label: '$10 - $100' },
                { value: '100-500', label: '$100 - $500' },
                { value: 'over500', label: '> $500' },
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
                  <span className="text-sm">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Slider */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Price Range</h3>
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
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Category</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === category.id}
                    onChange={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
                    className="w-4 h-4 text-green-500"
                  />
                  <span className="text-sm">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Brand</h3>
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
                    <span className="text-sm">{brand.name} ({productCount})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Rating</h3>
            <div className="space-y-2">
              {allRatings.map((rating) => {
                // Get count from database reviews for this specific rating
                const count = ratingCounts[rating] || 0;
                // Normalize rating for display (max 5 stars)
                const displayRating = Math.min(Math.max(rating, 1), 5);
                
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
                        <span key={i} className={i < displayRating ? 'text-yellow-400' : 'text-gray-500'}>
                          ★
                        </span>
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        ({count}) {rating > 5 && `[${rating}]`}
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
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            Remove Filter
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          {/* Top Header */}
          <div className="bg-white text-gray-900 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold">{showWishlistOnly ? 'Wishlist' : 'Shop'}</h1>
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filter</span>
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search Task"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border rounded text-gray-900 text-sm sm:text-base"
                  />
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                    {filteredProducts.length} Results
                  </span>
                  
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [by, order] = e.target.value.split('-');
                      setSortBy(by);
                      setSortOrder(order as 'asc' | 'desc');
                    }}
                    className="px-3 sm:px-4 py-2 border rounded text-gray-900 text-sm sm:text-base"
                  >
                    <option value="price-asc">Price Low to High</option>
                    <option value="price-desc">Price High to Low</option>
                    <option value="name-asc">Name A to Z</option>
                    <option value="name-desc">Name Z to A</option>
                  </select>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          {loading ? (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {paginatedProducts.map((product) => {
                    const image = getProductImage(product);
                    const price = getProductPrice(product);
                    
                    return (
                      <div
                        key={product.id}
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="cursor-pointer hover:scale-105 transition-transform"
                      >
                        <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden">
                          {image ? (
                            <Image
                              src={image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="text-green-500 font-bold text-base sm:text-lg mb-1">
                          ${parseFloat(price).toLocaleString()}
                        </div>
                        <h3 className="text-white font-semibold text-sm sm:text-base mb-2 line-clamp-2">{product.name}</h3>
                        {product.shortDesc && (
                          <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 mb-2">{product.shortDesc}</p>
                        )}
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-sm sm:text-base">★</span>
                            <span className="text-xs sm:text-sm text-gray-400">
                              {productRatings[product.id] ? productRatings[product.id].toFixed(1) : '0.0'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleWishlistToggle(product.id, e)}
                            className="p-1.5 sm:p-2 hover:bg-gray-800 rounded transition-colors"
                            aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            {wishlist.includes(product.id) ? (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            )}
                          </button>
                          <button className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded hover:bg-green-600 text-xs sm:text-sm whitespace-nowrap">
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
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-gray-800 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <div className="relative w-full sm:w-32 h-48 sm:h-32 rounded-lg overflow-hidden shrink-0">
                          {image ? (
                            <Image
                              src={image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-green-500 font-bold text-lg sm:text-xl mb-2">
                            ${parseFloat(price).toLocaleString()}
                          </div>
                          <h3 className="text-white font-semibold text-base sm:text-lg mb-2">{product.name}</h3>
                          {product.shortDesc && (
                            <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{product.shortDesc}</p>
                          )}
                          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400 text-sm sm:text-base">★</span>
                              <span className="text-xs sm:text-sm text-gray-400">
                                {productRatings[product.id] ? productRatings[product.id].toFixed(1) : '0.0'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleWishlistToggle(product.id, e)}
                              className="p-1.5 sm:p-2 hover:bg-gray-700 rounded transition-colors"
                              aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                              {wishlist.includes(product.id) ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              )}
                            </button>
                            <button className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded hover:bg-green-600 text-xs sm:text-sm whitespace-nowrap">
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
                          ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                          : 'border-green-500 text-green-500 hover:bg-green-500/10 cursor-pointer'
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
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded flex items-center justify-center transition-colors text-xs sm:text-sm ${
                            isActive
                              ? 'bg-gray-800 border border-green-500 text-green-500'
                              : 'bg-gray-800 border border-white text-white hover:bg-gray-700'
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
                          ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                          : 'border-white text-white hover:bg-gray-700 cursor-pointer'
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

