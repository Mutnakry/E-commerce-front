'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function AuthSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      if (token) {
        // Store token
        localStorage.setItem('token', token);
        
        // Try to fetch user profile
        try {
          const userData = await authApi.getUserProfile(token);
          // Store user data
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          // Redirect to home
          router.push('/');
        } catch (error: any) {
          console.error('Failed to fetch user profile:', error);
          
          // If /auth/me doesn't work, try to create a basic user object from token
          // Some backends might include user info in the token or redirect params
          const userFromParams: any = {};
          const username = searchParams.get('username');
          const name = searchParams.get('name');
          const email = searchParams.get('email');
          const profileImage = searchParams.get('profileImage') || searchParams.get('avatar');
          
          if (username || name || email) {
            userFromParams.username = username || name || email || 'User';
            userFromParams.name = name || username || 'User';
            userFromParams.email = email;
            userFromParams.profileImage = profileImage;
            userFromParams.id = searchParams.get('id') || '';
            
            localStorage.setItem('user', JSON.stringify(userFromParams));
            setUser(userFromParams);
            router.push('/');
          } else {
            setError('Failed to load user information. Redirecting...');
            setTimeout(() => router.push('/'), 2000);
          }
        }
      } else {
        setError('No authentication token found. Redirecting...');
        setTimeout(() => router.push('/'), 2000);
      }
    };

    handleAuth();
  }, [token, router, setUser, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-400">{error}</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-white">Completing login...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    }>
      <AuthSuccessPageContent />
    </Suspense>
  );
}

