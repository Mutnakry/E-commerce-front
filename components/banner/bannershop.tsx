'use client';

import { useState, useEffect } from 'react';
import { bannersApi } from '@/lib/api';
import { Banner } from '@/lib/types';
import Image from 'next/image';

export default function BannerShop() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const allBanners = await bannersApi.getBanners(token || undefined).catch(() => []);
        
        // Filter banners to show only active EVENT position banners
        const eventBanners = allBanners.filter(
          (banner) => banner.isActive && banner.position === 'EVENT'
        );
        
        setBanners(eventBanners);
      } catch (error) {
        console.error('Error fetching EVENT banners:', error);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Reset index when banners change
  useEffect(() => {
    if (banners.length > 0 && currentBannerIndex >= banners.length) {
      setCurrentBannerIndex(0);
    }
  }, [banners.length, currentBannerIndex]);

  // Auto-play: advance banner every 30 seconds
  useEffect(() => {
    if (banners.length <= 1) {
      return; // Don't auto-play if there's only one or no banners
    }

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [banners.length]);

  const nextBanner = () => {
    if (banners.length > 1) {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }
  };

  const prevBanner = () => {
    if (banners.length > 1) {
      setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  // Don't render if no banners
  if (loading) {
    return null;
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentBannerIndex];

  return (
    <div className="relative w-full mb-6 rounded-lg overflow-hidden">
      <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96">
        {currentBanner?.imageUrl ? (
          <Image
            src={currentBanner.imageUrl}
            alt={currentBanner.title || 'Event Banner'}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-green-800 to-black"></div>
        )}

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 flex items-center justify-center text-white hover:bg-gray-800 transition-colors z-20"
              aria-label="Previous banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextBanner}
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 flex items-center justify-center text-white hover:bg-gray-800 transition-colors z-20"
              aria-label="Next banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Navigation Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBannerIndex(index)}
                type="button"
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentBannerIndex ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Banner Title Below - Scrolling Text */}
      {currentBanner?.title && (
        <div className="px-2 py-2 bg-gray-900/50 rounded overflow-hidden">
          <div className="marquee-container">
            <div className="marquee-content">
              <span className="text-white text-lg sm:text-xl md:text-2xl font-semibold px-4">
                {currentBanner.title}
              </span>
              <span className="text-white text-lg sm:text-xl md:text-2xl font-semibold px-4">
                {currentBanner.title}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

