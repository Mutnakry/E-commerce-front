export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Upload endpoint - can be overridden via environment variable

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    TELEGRAM: `${API_BASE_URL}/auth/telegram`,
    ME: `${API_BASE_URL}/auth/me`,
  },
  BANNERS: {
    LIST: `${API_BASE_URL}/banners`,
  },
  BRANDS: {
    LIST: `${API_BASE_URL}/admin/brands`,
  },
  CATEGORIES: {
    LIST: `${API_BASE_URL}/admin/categories`,
    GET: (id: string) => `${API_BASE_URL}/admin/categories/${id}`,
  },
  PRODUCTS: {
    LIST: `${API_BASE_URL}/admin/products`,
    GET: (id: string) => `${API_BASE_URL}/admin/products/${id}`,
  },
  TAGS: {
    LIST: `${API_BASE_URL}/admin/tags`,
    GET: (id: string) => `${API_BASE_URL}/admin/tags/${id}`,
  },
  SECTIONS: {
    LIST: `${API_BASE_URL}/admin/sections`,
    GET: (id: string) => `${API_BASE_URL}/admin/sections/${id}`,
  },
  PROMOTIONS: {
    LIST: `${API_BASE_URL}/admin/promotions`,
    GET: (id: string) => `${API_BASE_URL}/admin/promotions/${id}`,
  },
  PRODUCT_VARIANTS: {
    LIST: `${API_BASE_URL}/admin/product-variants`,
    GET: (id: string) => `${API_BASE_URL}/admin/product-variants/${id}`,
  },
  REVIEWS: {
    LIST: `${API_BASE_URL}/admin/reviews`,
    GET: (id: string) => `${API_BASE_URL}/admin/reviews/${id}`,
  },
  ORDERS: {
    LIST: `${API_BASE_URL}/admin/orders`,
    GET: (id: string) => `${API_BASE_URL}/admin/orders/${id}`,
  },
  USERS: {
    LIST: `${API_BASE_URL}/users`,
    GET: (id: string) => `${API_BASE_URL}/users/${id}`,
    LOGS: `${API_BASE_URL}/users/logs`,
  },
};

