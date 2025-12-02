'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { productsApi } from '@/lib/api';
import { Product } from '@/lib/types';
import { wishlistUtils } from '@/lib/wishlist';
import Image from 'next/image';

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
    
    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      loadWishlist();
    };
    
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const wishlistIds = wishlistUtils.getWishlist();
      setWishlist(wishlistIds);

      if (wishlistIds.length > 0) {
        // Fetch all products and filter by wishlist
        const allProducts = await productsApi.getProducts().catch(() => []);
        const wishlistProducts = allProducts.filter(product => 
          wishlistIds.includes(product.id)
        );
        setProducts(wishlistProducts);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Error loading wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    wishlistUtils.toggleWishlist(productId);
    setWishlist(wishlistUtils.getWishlist());
    
    // Remove from products if removed from wishlist
    if (!wishlistUtils.isInWishlist(productId)) {
      setProducts(products.filter(p => p.id !== productId));
    }
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
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">My Wishlist</h1>
          <p className="text-gray-400">
            {products.length} {products.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-6">Start adding products you love!</p>
            <button
              onClick={() => router.push('/shop')}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const image = getProductImage(product);
              const price = getProductPrice(product);
              
              return (
                <div
                  key={product.id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition-transform shadow-lg group relative"
                >
                  <div 
                    className="relative w-full aspect-square cursor-pointer"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Remove from wishlist button */}
                    <button
                      onClick={(e) => handleWishlistToggle(product.id, e)}
                      className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-gray-600 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors z-10"
                      aria-label="Remove from wishlist"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <h3 
                      className="text-white font-semibold mb-2 line-clamp-2 cursor-pointer hover:text-green-400 transition-colors"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    {product.shortDesc && (
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">{product.shortDesc}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-green-500 font-bold text-lg">
                          ${parseFloat(price).toLocaleString()}
                        </span>
                        {product.compareAt && (
                          <span className="text-gray-400 text-xs line-through">
                            ${parseFloat(product.compareAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm"
                      >
                        View Details
                      </button>
                      <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm">
                        Add To Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

