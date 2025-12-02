export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  phoneNumber?: string;
  profileImage?: string | null;
  googleId?: string | null;
  telegramId?: string | null;
  githubId?: string | null;
  status?: string;
  walletCurrency?: string;
  balance?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token?: string;
  user?: User;
  message?: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  position?: 'MAIN' | 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT' | 'PROMOTION' | 'GAME' | 'EVENT';
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;
  price_in_kh: string;
  price_in_usd: string;
  price_out_kh: string;
  price_out_usd: string;
  base_price_usd: string;
  compareAt_usd?: string;
  compareAt_kh?: string;
  images?: string[];
  attributes?: Record<string, any>;
  stockQty?: number;
  barcode?: string;
  serialNumber?: string | null;
  warehouseLocation?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  price: string;
  compareAt?: string;
  currency: string;
  published: boolean;
  stockManaged: boolean;
  brandId?: string;
  images?: string[];
  metadata?: Record<string, any>;
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  comment?: string;
  images?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
}

