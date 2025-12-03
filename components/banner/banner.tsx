'use client';

import { useState, useEffect } from 'react';
import { Banner, UserLog } from '@/lib/types';
import { userLogsApi } from '@/lib/api';
import Image from 'next/image';

interface BannerCarouselProps {
  banners: Banner[];
  loading: boolean;
}

export default function BannerCarousel({ banners, loading }: BannerCarouselProps) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [scrollIndex, setScrollIndex] = useState(0);

  // Reset index when banners change
  useEffect(() => {
    if (banners.length > 0 && currentBannerIndex >= banners.length) {
      setCurrentBannerIndex(0);
    }
  }, [banners.length, currentBannerIndex]);

  // Fetch user logs
  useEffect(() => {
    const fetchUserLogs = async () => {
      try {
        setLogsLoading(true);
        const token = localStorage.getItem('token');
        const logs = await userLogsApi.getUserLogs(token || undefined);
        console.log('Fetched user logs:', logs);
        setUserLogs(logs || []);
      } catch (error) {
        console.error('Error fetching user logs:', error);
        setUserLogs([]);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchUserLogs();
  }, []);

  // Auto-scroll user logs (show 3 items, scroll bottom to top)
  useEffect(() => {
    if (userLogs.length <= 3) {
      setScrollIndex(0);
      return; // Don't scroll if we have 3 or fewer items
    }

    const interval = setInterval(() => {
      setScrollIndex((prev) => {
        // Calculate max index to ensure we always show 3 items
        const maxIndex = userLogs.length;
        const nextIndex = prev + 1;
        // Reset to 0 when we reach the end for seamless loop (since we duplicate the array)
        return nextIndex >= maxIndex ? 0 : nextIndex;
      });
    }, 3000); // Change every 3 seconds

    return () => {
      clearInterval(interval);
    };
  }, [userLogs.length]);

  const currentBanner = banners[currentBannerIndex] || null;

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

  const goToBanner = (index: number) => {
    if (index >= 0 && index < banners.length) {
      setCurrentBannerIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-[600px] bg-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      {/* Background Image */}
      {currentBanner?.imageUrl ? (
        <div className="absolute inset-0">
          <Image
            src={currentBanner.imageUrl}
            alt={currentBanner.title || 'Banner'}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-black"></div>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 h-full container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          {/* Left: Banner Card */}
          <div className="md:col-span-1">
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-8 border border-gray-700 max-w-xl">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <div className="text-white text-4xl font-bold">M</div>
              </div>

              {/* Title */}
              <div className="text-center mb-2">
                <p className="text-sm text-gray-400">VITALITY /// MISFITS PREMIER</p>
              </div>

              {/* GAMEDAY Text */}
              <div className="text-center mb-4">
                <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight">GAMEDAY</h1>
              </div>

              {/* Dots and Date */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <span className="text-white text-sm">02.02.2022</span>
              </div>

              {/* Sponsor Logos */}
              <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
                <div className="text-white text-xs opacity-70">Tezos</div>
                <div className="text-white text-xs opacity-70 relative">
                  <span>adidas</span>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-white text-xs opacity-70">CORSAIR</div>
                <div className="text-white text-xs opacity-70">QUERSUS</div>
                <div className="text-white text-xs opacity-70">A</div>
                <div className="text-white text-xs opacity-70">AFFLELOU</div>
              </div>

              {/* Navigation Dots */}
              {banners.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToBanner(index)}
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
          </div>

          {/* Right: Activity Feed */}
          <div className="md:col-span-1">
            <div className=" h-[300px] overflow-hidden relative">
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : userLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No activity logs available</p>
                </div>
              ) : (
                <div className="relative h-full overflow-y-auto activity-feed-scrollbar pr-2">
                  {/* Show only 3 items at a time with mask */}
                  <div className="relative overflow-hidden" style={{ height: '540px' }}>
                    <div 
                      className="space-y-4 transition-transform duration-1000 ease-in-out"
                      style={{
                        transform: `translateY(-${scrollIndex * 180}px)`, // 180px per item (160px height + 16px gap)
                      }}
                    >
                      {/* Duplicate logs for seamless infinite scroll */}
                      {[...userLogs, ...userLogs].map((log, index) => {
                        // Get user identifier (masked phone number or username)
                        const userIdentifier = log.user || log.phoneNumber || 'User';
                        // Mask phone number if it's a phone number format
                        const maskedUser = userIdentifier.includes('*') 
                          ? userIdentifier 
                          : userIdentifier.length > 4 
                            ? `${userIdentifier.slice(0, 3)}****${userIdentifier.slice(-4)}`
                            : userIdentifier;
                        
                        // Get item/product name
                        const itemName = log.item || log.productName || log.message || 'Item';
                        
                        // Get badge number
                        const badgeNumber = log.badge || '1';
                        
                        // Get first character for avatar
                        const firstChar = maskedUser.charAt(0).toUpperCase();

                        return (
                          <div key={`${log.id || index}-${Math.floor(index / userLogs.length)}`} className="flex items-start gap-3 min-h-[15px] bg-gray-900/80 rounded-lg px-2 py-4">
                            <div className="relative shrink-0">
                              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                                {firstChar}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900">
                                {badgeNumber}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium mb-1">{maskedUser}</p>
                              <p className="text-green-500 text-xs mb-1">Open The Gold Treasure To Get</p>
                              <p className="text-green-500 text-xs">{itemName}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Gradient mask to fade top and bottom */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-900/80 to-transparent pointer-events-none z-10"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900/80 to-transparent pointer-events-none z-10"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 flex items-center justify-center text-white hover:bg-gray-800 transition-colors z-30 cursor-pointer"
              aria-label="Previous banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextBanner}
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 flex items-center justify-center text-white hover:bg-gray-800 transition-colors z-30 cursor-pointer"
              aria-label="Next banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

