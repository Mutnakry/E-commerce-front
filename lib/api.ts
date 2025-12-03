import { User, AuthResponse, Banner, Product, Brand, Category, Review, UserLog, Promotion } from './types';
import { API_ENDPOINTS } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset email');
    }

    return response.json();
  },

  getTelegramAuthUrl: async (): Promise<{ url: string }> => {
    const response = await fetch(API_ENDPOINTS.AUTH.TELEGRAM, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to get Telegram auth URL');
    }

    return response.json();
  },

  getUserProfile: async (token: string): Promise<User> => {
    const response = await fetch(API_ENDPOINTS.AUTH.ME, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return response.json();
  },
};

const API_BASE_URL_FALLBACK = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/v1/api';

export const bannersApi = {
  getBanners: async (token?: string): Promise<Banner[]> => {
    const url = `${API_BASE_URL_FALLBACK}/banners`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    // Handle 401 gracefully - banners might be public or require auth
    if (response.status === 401) {
      console.warn('Banners endpoint requires authentication, returning empty array');
      return [];
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch banners: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Handle nested response structure: { success, message, data }
    if (data.success && data.data) {
      return Array.isArray(data.data) ? data.data : [];
    }
    // Handle direct array response
    return Array.isArray(data) ? data : (data.data || data.items || []);
  },
};

export const productsApi = {
  getProducts: async (params?: { 
    page?: number; 
    limit?: number; 
    categoryId?: string;
    brandId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.brandId) queryParams.append('brandId', params.brandId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `${API_BASE_URL_FALLBACK}/admin/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    // Handle nested response structure: { success, message, data }
    if (data.success && data.data) {
      return Array.isArray(data.data) ? data.data : [];
    }
    // Handle direct array response
    return Array.isArray(data) ? data : (data.data || data.items || []);
  },

  getProduct: async (id: string): Promise<Product> => {
    const url = `${API_BASE_URL_FALLBACK}/admin/products/${id}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }

    const data = await response.json();
    // Handle nested response structure: { success, message, data }
    if (data.success && data.data) {
      return data.data;
    }
    // Handle direct product object
    return data;
  },
};

export const brandsApi = {
  getBrands: async (): Promise<Brand[]> => {
    const url = `${API_BASE_URL_FALLBACK}/admin/brands`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch brands');
    }

    const data = await response.json();
    if (data.success && data.data) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return Array.isArray(data) ? data : (data.data || data.items || []);
  },
};

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const url = `${API_BASE_URL_FALLBACK}/admin/categories`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    if (data.success && data.data) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return Array.isArray(data) ? data : (data.data || data.items || []);
  },
};

export const reviewsApi = {
  getReviews: async (productId?: string): Promise<Review[]> => {
    const url = productId 
      ? `${API_BASE_URL_FALLBACK}/admin/reviews?productId=${productId}`
      : `${API_BASE_URL_FALLBACK}/admin/reviews`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }

    const data = await response.json();
    if (data.success && data.data) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return Array.isArray(data) ? data : (data.data || data.items || []);
  },
};

export const userLogsApi = {
  getUserLogs: async (token?: string): Promise<UserLog[]> => {
    // Use fallback URL to ensure /v1/api is included
    const url = `${API_BASE_URL_FALLBACK}/users/logs`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // Handle 401 gracefully - logs might be public or require auth
      if (response.status === 401) {
        console.warn('User logs endpoint requires authentication, returning empty array');
        return [];
      }

      if (!response.ok) {
        console.error(`Failed to fetch user logs: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch user logs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('User logs API response:', data);
      
      // Handle nested response structure: { success, message, data }
      if (data.success && data.data) {
        const logs = Array.isArray(data.data) ? data.data : [];
        console.log('Parsed logs from data.data:', logs);
        return logs;
      }
      
      // Handle direct array response
      if (Array.isArray(data)) {
        console.log('Direct array response:', data);
        return data;
      }
      
      // Try other possible response structures
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      if (data.items && Array.isArray(data.items)) {
        return data.items;
      }
      
      if (data.logs && Array.isArray(data.logs)) {
        return data.logs;
      }
      
      console.warn('Unexpected response structure:', data);
      return [];
    } catch (error) {
      console.error('Error in getUserLogs:', error);
      throw error;
    }
  },
};

export const promotionsApi = {
  getPromotions: async (token?: string): Promise<Promotion[]> => {
    const API_BASE_URL_FALLBACK = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/v1/api';
    const url = `${API_BASE_URL_FALLBACK}/admin/promotions`;
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'accept': '*/*',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch promotions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle nested response structure: { success, message, data }
      if (data.success && data.data) {
        return Array.isArray(data.data) ? data.data : [];
      }
      
      // Handle direct array response
      return Array.isArray(data) ? data : (data.data || data.items || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }
  },
};

