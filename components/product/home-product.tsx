'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import Image from 'next/image';

interface HomeProductProps {
  products: Product[];
  loading: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function HomeProduct({ products, loading }: HomeProductProps) {
  const router = useRouter();
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = useMemo(() => {
    return products.slice(startIndex, endIndex);
  }, [products, startIndex, endIndex]);

  // Reset to page 1 when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  // Generate page numbers to display (max 5 pages shown)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, current page area, and last page
      if (currentPage <= 3) {
        // Show first 5 pages
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 5 pages
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show pages around current
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

  const getProductImages = (product: Product): string[] => {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    if (product.variants && product.variants[0]?.images && product.variants[0].images.length > 0) {
      return product.variants[0].images;
    }
    return [];
  };

  const getCurrentImageIndex = (productId: string, totalImages: number): number => {
    if (totalImages === 0) return 0;
    return imageIndices[productId] || 0;
  };

  const nextImage = (productId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalImages > 1) {
      setImageIndices((prev) => ({
        ...prev,
        [productId]: ((prev[productId] || 0) + 1) % totalImages,
      }));
    }
  };

  const prevImage = (productId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalImages > 1) {
      setImageIndices((prev) => ({
        ...prev,
        [productId]: ((prev[productId] || 0) - 1 + totalImages) % totalImages,
      }));
    }
  };

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };
  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    // Fallback Products Section
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Trendy play [Colorful]</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: 'Exploding Hulk', color: 'from-red-500 to-orange-500' },
            { name: 'Red To Purple', color: 'from-red-500 to-purple-500' },
            { name: 'Gold Treasure', color: 'from-yellow-500 to-orange-500' },
            { name: 'Pink Girl Heart', color: 'from-pink-500 to-rose-500' },
            { name: 'Gray Silence', color: 'from-gray-500 to-gray-700' },
          ].map((box, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${box.color} rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform shadow-lg`}
            >
              <div className="text-white font-semibold text-center">{box.name}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Trendy play [Colorful]</h2>
        <a href="/shop" className="text-green-500 hover:text-green-400 transition-colors text-sm">
          View All
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {paginatedProducts.map((product) => {
          const productImages = getProductImages(product);
          const currentIndex = getCurrentImageIndex(product.id, productImages.length);
          const currentImage = productImages[currentIndex];
          const hasMultipleImages = productImages.length > 1;

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className="rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-lg group relative"
            >
              <div className="relative w-full aspect-square">
                {currentImage ? (
                  <>
                    <Image
                      src={currentImage}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform"
                      unoptimized
                    />
                    {/* Navigation Arrows - Only show if multiple images */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={(e) => prevImage(product.id, productImages.length, e)}
                          type="button"
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-gray-600 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10 opacity-0 group-hover:opacity-100"
                          aria-label="Previous image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => nextImage(product.id, productImages.length, e)}
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-gray-600 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10 opacity-0 group-hover:opacity-100"
                          aria-label="Next image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {/* Image Indicator Dots */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          {productImages.map((_, index) => (
                            <div
                              key={index}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                index === currentIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
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
            <div className="p-4">
              <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                {product.variants && product.variants.length > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-green-500 font-bold text-sm">
                      {parseFloat(product.variants[0].price_out_usd || product.variants[0].price_in_usd).toLocaleString()} <span className="text-xs">USD</span>
                    </span>
                    <span className="text-gray-400 text-xs">
                      {parseFloat(product.variants[0].price_out_kh || product.variants[0].price_in_kh).toLocaleString()} KHR
                    </span>
                  </div>
                ) : product.price ? (
                  <div className="flex flex-col">
                    <span className="text-green-500 font-bold text-sm">
                      {parseFloat(product.price).toLocaleString()} <span className="text-xs">{product.currency || 'USD'}</span>
                    </span>
                    {product.compareAt && (
                      <span className="text-gray-400 text-xs line-through">
                        {parseFloat(product.compareAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-end justify-end gap-2 mt-8">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`w-10 h-10 rounded flex items-center justify-center border transition-colors ${
              currentPage === 1
                ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                : 'border-green-500 text-green-500 hover:bg-green-500/10 cursor-pointer'
            }`}
            aria-label="Previous page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="text-gray-500 px-2">
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
                className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-gray-800 border border-green-500 text-green-500'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
                aria-label={`Go to page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`w-10 h-10 rounded flex items-center justify-center border transition-colors ${
              currentPage === totalPages
                ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                : 'border-green-500 text-green-500 hover:bg-green-500/10 cursor-pointer'
            }`}
            aria-label="Next page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}

