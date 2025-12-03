'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { bannersApi, productsApi } from '@/lib/api';
import { Banner, Product } from '@/lib/types';
import BannerCarousel from '@/components/banner/banner';
import HomeProduct from '@/components/product/home-product';
import HowPromotion from '@/components/promotions/how-promotion';

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const [bannersData, productsData] = await Promise.all([
          bannersApi.getBanners(token || undefined).catch(() => []),
          productsApi.getProducts().catch(() => []),
        ]);
        
        // Filter banners to show only active MAIN position banners
        const activeMainBanners = bannersData.filter(
          (banner) => banner.isActive && banner.position === 'MAIN'
        );
        
        setBanners(activeMainBanners.length > 0 ? activeMainBanners : bannersData.filter(b => b.isActive));
        setProducts(productsData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <main>
        {/* Hero Banner Section with Background */}
        <BannerCarousel banners={banners} loading={loading} />

        {/* Bottom Text Banner */}
        <div className="bg-green-600/20 border-y border-green-500/30 py-3 px-4">
          <div className="container mx-auto">
            <p className="text-gray-300 text-sm text-center truncate">
              Open new boxes enough times to participate in the roll room event and there are hidden Easter eggs and mysterious prizes waiting for you. You can ha...
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Promotions Section */}
          <HowPromotion />

          {/* Products Section */}
          <HomeProduct products={products} loading={loading} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
