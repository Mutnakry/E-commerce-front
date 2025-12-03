'use client';

import { useState, useEffect } from 'react';
import { promotionsApi } from '@/lib/api';
import { Promotion } from '@/lib/types';

export default function HowPromotion() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const data = await promotionsApi.getPromotions(token || undefined);
        
        // Filter to show only active promotions
        const activePromotions = data.filter(promo => promo.active);
        setPromotions(activePromotions);
      } catch (err: any) {
        console.error('Error fetching promotions:', err);
        setError(err.message || 'Failed to load promotions');
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const formatDiscount = (promotion: Promotion): string => {
    if (promotion.discountType === 'PERCENTAGE') {
      return `${promotion.value}% OFF`;
    } else {
      return `$${promotion.value} OFF`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isPromotionActive = (promotion: Promotion): boolean => {
    const now = new Date();
    const startsAt = new Date(promotion.startsAt);
    const endsAt = new Date(promotion.endsAt);
    return now >= startsAt && now <= endsAt && promotion.active;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300 text-center">
          {error}
        </div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return null; // Don't show anything if no promotions
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Special Promotions</h2>
        <p className="text-gray-400">Don't miss out on these amazing deals!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promotion) => {
          const isActive = isPromotionActive(promotion);
          
          return (
            <div
              key={promotion.id}
              className={`bg-gray-800 rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${
                isActive 
                  ? 'border-green-500 shadow-lg shadow-green-500/20' 
                  : 'border-gray-700 opacity-75'
              }`}
            >
              {/* Discount Badge */}
              <div className={`px-4 py-3 ${
                isActive ? 'bg-green-500' : 'bg-gray-700'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-lg">
                    {formatDiscount(promotion)}
                  </span>
                  {isActive && (
                    <span className="bg-white text-green-500 text-xs font-semibold px-2 py-1 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Promotion Content */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-2">
                  {promotion.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {promotion.description}
                </p>

                {/* Date Range */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(promotion.startsAt)} - {formatDate(promotion.endsAt)}</span>
                </div>

                {/* Status Indicator */}
                {!isActive && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span>Ended</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


