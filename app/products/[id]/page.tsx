'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, ProductVariant, Brand, Review } from '@/lib/types';
import { productsApi, brandsApi, reviewsApi } from '@/lib/api';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { wishlistUtils } from '@/lib/wishlist';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const relatedProductsRef = useRef<HTMLDivElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [relatedScrollPosition, setRelatedScrollPosition] = useState(0);
  const [variantViewMode, setVariantViewMode] = useState<'grid' | 'list'>('grid');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
      setIsInWishlist(wishlistUtils.isInWishlist(productId));
    }
  }, [productId]);

  // Listen for wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (productId) {
        setIsInWishlist(wishlistUtils.isInWishlist(productId));
      }
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [productId]);

  const fetchProductDetails = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);
      const productData = await productsApi.getProduct(productId);
      setProduct(productData);
      
      // Set first available variant as selected
      if (productData.variants && productData.variants.length > 0) {
        const firstAvailableVariant = productData.variants.find(v => 
          v.stockQty === undefined || v.stockQty === null || v.stockQty > 0
        );
        setSelectedVariant(firstAvailableVariant || productData.variants[0]);
      }

      // Fetch brand if brandId exists
      if (productData.brandId) {
        try {
          const brands = await brandsApi.getBrands();
          const foundBrand = brands.find(b => b.id === productData.brandId);
          if (foundBrand) {
            setBrand(foundBrand);
          }
        } catch (err) {
          console.error('Error fetching brand:', err);
        }
      }

      // Fetch all reviews (for current product and related products)
      try {
        const allReviews = await reviewsApi.getReviews();
        setReviews(allReviews);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }

      // Fetch related products (same brand or category)
      try {
        const allProducts = await productsApi.getProducts();
        const related = allProducts
          .filter(p => p.id !== productId && (p.brandId === productData.brandId));
        setRelatedProducts(related);
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    } catch (err: any) {
      console.error('Error fetching product details:', err);
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const getProductImages = (): string[] => {
    if (!product) return [];
    
    // Use selected variant images if available, otherwise use product images
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return [];
  };

  const productImages = getProductImages();
  const currentImage = productImages[currentImageIndex] || null;

  const nextImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }
  };

  const prevImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    }
  };

  // Calculate average rating for current product
  const productReviews = reviews.filter(r => r.productId === productId);
  const averageRating = productReviews.length > 0
    ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
    : 0;

  // Get available color variants (with stock > 0 or stock not managed)
  const colorVariants = product?.variants?.filter(v => {
    const hasColor = v.attributes && ('color' in v.attributes || 'Color' in v.attributes);
    const isAvailable = v.stockQty === undefined || v.stockQty === null || v.stockQty > 0;
    return hasColor && isAvailable;
  }) || [];

  const getColorValue = (variant: ProductVariant): string | null => {
    if (!variant.attributes) return null;
    return variant.attributes.color || variant.attributes.Color || null;
  };

  // Color name to hex mapping (simplified)
  const colorToHex: Record<string, string> = {
    'red': '#EF4444',
    'orange': '#F97316',
    'blue': '#3B82F6',
    'black': '#000000',
    'white': '#FFFFFF',
    'green': '#10B981',
    'yellow': '#FBBF24',
    'purple': '#A855F7',
  };

  const updateScrollButtons = () => {
    if (!relatedProductsRef.current) return;
    
    const currentScroll = relatedProductsRef.current.scrollLeft;
    const containerWidth = relatedProductsRef.current.offsetWidth;
    const scrollWidth = relatedProductsRef.current.scrollWidth;
    
    setCanScrollLeft(currentScroll > 0);
    setCanScrollRight(currentScroll < scrollWidth - containerWidth - 1); // -1 for rounding errors
  };

  const scrollRelatedProducts = (direction: 'left' | 'right') => {
    if (!relatedProductsRef.current) return;
    
    // Get the first product card to calculate width
    const firstCard = relatedProductsRef.current.querySelector('[data-product-card]') as HTMLElement;
    if (!firstCard) return;
    
    // Calculate scroll amount: card width + gap (24px = gap-6)
    const cardWidth = firstCard.offsetWidth;
    const gap = 24; // gap-6 = 1.5rem = 24px
    const scrollAmount = cardWidth + gap;
    
    const currentScroll = relatedProductsRef.current.scrollLeft;
    const containerWidth = relatedProductsRef.current.offsetWidth;
    const scrollWidth = relatedProductsRef.current.scrollWidth;
    
    let newPosition: number;
    
    if (direction === 'left') {
      // Scroll left by one card
      newPosition = Math.max(0, currentScroll - scrollAmount);
    } else {
      // Scroll right by one card
      const maxScroll = scrollWidth - containerWidth;
      newPosition = Math.min(maxScroll, currentScroll + scrollAmount);
    }
    
    setRelatedScrollPosition(newPosition);
    relatedProductsRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    
    // Update button states after scroll animation
    setTimeout(() => {
      updateScrollButtons();
    }, 300);
  };

  // Update scroll button states on mount and when products change
  useEffect(() => {
    if (relatedProducts.length > 0) {
      setTimeout(() => {
        updateScrollButtons();
      }, 100);
    }
  }, [relatedProducts]);

  const getProductPrice = (product: Product): string => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].price_out_usd || product.variants[0].price_in_usd || '0';
    }
    return product.price || '0';
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Go to Home
            </button>
          </div>
        ) : product ? (
          <>
            {/* Main Product Section */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Left: Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {currentImage ? (
                    <>
                      <Image
                        src={currentImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {/* Navigation Arrows */}
                      {productImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            type="button"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white transition-colors z-10"
                            aria-label="Previous image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={nextImage}
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white transition-colors z-10"
                            aria-label="Next image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Thumbnail Images */}
                {productImages.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {productImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? 'border-green-500' : 'border-gray-300'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product Details */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  {brand && (
                    <p className="text-sm sm:text-base text-gray-600 mb-4">By {brand.name}</p>
                  )}
                </div>

                {/* Price and Rating */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${parseFloat(selectedVariant?.price_out_usd || selectedVariant?.price_in_usd || product.price || '0').toLocaleString()}
                    </span>
                  </div>
                  {productReviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-gray-600">
                        From {productReviews.length} {productReviews.length === 1 ? 'Review' : 'Reviews'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* EMI Options */}
                <div className="text-gray-600">
                  <span className="font-medium">5 EMI Options Available</span>
                </div>

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Variants</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setVariantViewMode('grid')}
                          className={`p-2 rounded-lg transition-colors ${
                            variantViewMode === 'grid'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          aria-label="Grid view"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setVariantViewMode('list')}
                          className={`p-2 rounded-lg transition-colors ${
                            variantViewMode === 'list'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          aria-label="List view"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div
                      className={
                        variantViewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto'
                          : 'space-y-3 max-h-96 overflow-y-auto'
                      }
                    >
                      {product.variants.map((variant) => {
                        const isAvailable = variant.stockQty === undefined || variant.stockQty === null || variant.stockQty > 0;
                        // Only show as selected if it's available
                        const isSelected = isAvailable && selectedVariant?.id === variant.id;
                        
                        return (
                          <div
                            key={variant.id}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedVariant(variant);
                              }
                            }}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                              isSelected
                                ? 'border-green-500 bg-green-50 cursor-pointer'
                                : isAvailable
                                ? 'border-gray-300 hover:border-gray-400 cursor-pointer'
                                : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className={variantViewMode === 'grid' ? 'flex flex-col gap-3' : 'flex items-start justify-between gap-4'}>
                              {variant.images && variant.images.length > 0 && (
                                <div className={`relative ${variantViewMode === 'grid' ? 'w-full aspect-square' : 'w-20 h-20'} rounded-lg overflow-hidden border border-gray-200 shrink-0`}>
                                  <Image
                                    src={variant.images[0]}
                                    alt={variant.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="text-gray-900 font-medium mb-2">{variant.title}</h4>
                                {variant.attributes && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {Object.entries(variant.attributes).map(([key, value]) => {
                                      // Show color as a circle if it's a color attribute
                                      if ((key.toLowerCase() === 'color' || key.toLowerCase() === 'colour') && typeof value === 'string') {
                                        const colorHex = colorToHex[value.toLowerCase()] || '#000000';
                                        return (
                                          <div key={key} className="flex items-center gap-2">
                                            <span className="text-gray-600 text-xs">{key}:</span>
                                            <div
                                              className="w-5 h-5 rounded-full border border-gray-300"
                                              style={{ backgroundColor: colorHex }}
                                              title={value}
                                            />
                                          </div>
                                        );
                                      }
                                      return (
                                        <span
                                          key={key}
                                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                        >
                                          {key}: {String(value)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900 font-semibold">
                                      ${parseFloat(variant.price_out_usd || variant.price_in_usd || '0').toLocaleString()}
                                    </span>
                                    {variant.compareAt_usd && (
                                      <span className="text-gray-500 line-through text-sm">
                                        ${parseFloat(variant.compareAt_usd).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  {variant.stockQty !== undefined && variant.stockQty !== null && (
                                    <p className={`text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                      {isAvailable ? `In Stock (${variant.stockQty})` : 'Out of Stock'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    View In Cart
                  </button>
                  <button
                    onClick={() => {
                      wishlistUtils.toggleWishlist(product.id);
                      setIsInWishlist(wishlistUtils.isInWishlist(product.id));
                    }}
                    className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                      isInWishlist
                        ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                        : 'bg-blue-50 text-blue-600 border-2 border-blue-200 hover:bg-blue-100'
                    }`}
                    aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <svg className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Wishlist</span>
                  </button>
                </div>

                {/* Share Options */}
                <div className="pt-4">
                  <p className="text-gray-600 mb-2">Share To</p>
                  <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-6.138 3.455c-.208.117-.448.117-.656 0L5.106 8.221c-.24-.135-.106-.389.208-.389h12.372c.313 0 .448.254.208.389zM5.106 9.779l6.138 3.455c.208.117.448.117.656 0l6.138-3.455c.24-.135.106-.389-.208-.389H5.314c-.313 0-.448.254-.208.389zm11.788 1.221l-6.138 3.455c-.208.117-.448.117-.656 0L4.106 11c-.24-.135-.106-.389.208-.389h12.372c.313 0 .448.254.208.389z"/>
                      </svg>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center hover:bg-gray-500 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm-1 4v8h8v-2h-6V6h-2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Guarantees and Services Section */}
            <div className="bg-green-50 rounded-lg p-6 mb-12">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">100% Original</h3>
                    <p className="text-sm text-gray-600">Chocolate Bar Candy Canes Ice Cream Toffee Cookie Havah.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">10 Day Replacement</h3>
                    <p className="text-sm text-gray-600">Marshmallow Biscuit Donut Dragée Fruitcake Wafer.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">1 Year Warranty</h3>
                    <p className="text-sm text-gray-600">Cotton Candy Gingerbread Cake I Love Sugar Sweet.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
                    <p className="text-gray-600 mt-1">People Also Search For This Items</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => router.push('/shop')}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
                    >
                      View All
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollRelatedProducts('left');
                        }}
                        disabled={!canScrollLeft}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          canScrollLeft
                            ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                            : 'bg-gray-50 cursor-not-allowed opacity-50'
                        }`}
                        aria-label="Scroll left"
                      >
                        <svg className={`w-5 h-5 ${canScrollLeft ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollRelatedProducts('right');
                        }}
                        disabled={!canScrollRight}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          canScrollRight
                            ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                            : 'bg-gray-50 cursor-not-allowed opacity-50'
                        }`}
                        aria-label="Scroll right"
                      >
                        <svg className={`w-5 h-5 ${canScrollRight ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  ref={relatedProductsRef}
                  onScroll={updateScrollButtons}
                  className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {relatedProducts.map((relatedProduct) => {
                    const image = getProductImage(relatedProduct);
                    const price = getProductPrice(relatedProduct);
                    const productReviews = reviews.filter(r => r.productId === relatedProduct.id);
                    const avgRating = productReviews.length > 0
                      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
                      : 0;

                    return (
                      <div
                        key={relatedProduct.id}
                        data-product-card
                        className="shrink-0 w-64 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/products/${relatedProduct.id}`)}
                      >
                        <div className="relative w-full aspect-square bg-gray-100">
                          {image ? (
                            <Image
                              src={image}
                              alt={relatedProduct.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-lg font-bold text-gray-900 mb-1">${parseFloat(price).toLocaleString()}</p>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{relatedProduct.name}</h3>
                          {brand && (
                            <p className="text-xs text-gray-600 mb-2">By {brand.name}</p>
                          )}
                          {relatedProduct.shortDesc && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{relatedProduct.shortDesc}</p>
                          )}
                          {productReviews.length > 0 && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${i < Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
