'use client';

import { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/lib/types';
import { productsApi } from '@/lib/api';
import Image from 'next/image';

interface ProductDetailModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ productId, isOpen, onClose }: ProductDetailModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails();
    } else {
      // Reset state when modal closes
      setProduct(null);
      setSelectedVariant(null);
      setCurrentImageIndex(0);
      setError(null);
    }
  }, [isOpen, productId]);

  const fetchProductDetails = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);
      const productData = await productsApi.getProduct(productId);
      setProduct(productData);
      
      // Set first variant as selected if available
      if (productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col m-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : product ? (
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Left: Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative w-full aspect-square bg-gray-800 rounded-lg overflow-hidden">
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
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-gray-600 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
                            aria-label="Previous image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={nextImage}
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-gray-600 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
                            aria-label="Next image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          {/* Image Indicator */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {productImages.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
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

                {/* Thumbnail Images */}
                {productImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {productImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? 'border-green-500' : 'border-gray-700'
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
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{product.name}</h2>
                  {product.shortDesc && (
                    <p className="text-gray-400 text-sm mb-4">{product.shortDesc}</p>
                  )}
                  {product.sku && (
                    <p className="text-gray-500 text-xs">SKU: {product.sku}</p>
                  )}
                </div>

                {/* Price */}
                <div className="space-y-2">
                  {selectedVariant ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-500">
                          {parseFloat(selectedVariant.price_out_usd || selectedVariant.price_in_usd).toLocaleString()}
                        </span>
                        <span className="text-gray-400">USD</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl text-gray-300">
                          {parseFloat(selectedVariant.price_out_kh || selectedVariant.price_in_kh).toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-sm">KHR</span>
                      </div>
                      {selectedVariant.compareAt_usd && (
                        <p className="text-gray-500 line-through text-sm">
                          {parseFloat(selectedVariant.compareAt_usd).toLocaleString()} USD
                        </p>
                      )}
                    </>
                  ) : product.price ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-500">
                          {parseFloat(product.price).toLocaleString()}
                        </span>
                        <span className="text-gray-400">{product.currency || 'USD'}</span>
                      </div>
                      {product.compareAt && (
                        <p className="text-gray-500 line-through text-sm">
                          {parseFloat(product.compareAt).toLocaleString()} {product.currency || 'USD'}
                        </p>
                      )}
                    </>
                  ) : null}
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Variants</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            selectedVariant?.id === variant.id
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-2">{variant.title}</h4>
                              {variant.attributes && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {Object.entries(variant.attributes).map(([key, value]) => (
                                    <span
                                      key={key}
                                      className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                                    >
                                      {key}: {String(value)}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-500 font-semibold">
                                    {parseFloat(variant.price_out_usd || variant.price_in_usd).toLocaleString()} USD
                                  </span>
                                  {variant.compareAt_usd && (
                                    <span className="text-gray-500 line-through text-sm">
                                      {parseFloat(variant.compareAt_usd).toLocaleString()} USD
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-400 text-sm">
                                  {parseFloat(variant.price_out_kh || variant.price_in_kh).toLocaleString()} KHR
                                </div>
                              </div>
                              {variant.stockQty !== undefined && (
                                <p className="text-gray-400 text-xs mt-2">
                                  Stock: {variant.stockQty}
                                </p>
                              )}
                              {variant.sku && (
                                <p className="text-gray-500 text-xs">SKU: {variant.sku}</p>
                              )}
                            </div>
                            {variant.images && variant.images.length > 0 && (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden ml-4">
                                <Image
                                  src={variant.images[0]}
                                  alt={variant.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {product.metadata && Object.keys(product.metadata).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Specifications</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(product.metadata).map(([key, value]) => (
                        <div key={key} className="p-2 bg-gray-800 rounded">
                          <span className="text-gray-400 text-xs">{key}:</span>
                          <span className="text-white text-sm ml-2">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold">
                    Add to Cart
                  </button>
                  <button className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

