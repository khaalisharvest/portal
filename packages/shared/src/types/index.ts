// User types
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'seller' | 'farmer' | 'vet' | 'logistics';
  isActive: boolean;
  profileImage?: string;
  address?: Address;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  coordinates?: Coordinates;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserPreferences {
  language?: string;
  notifications?: boolean;
  deliveryTime?: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  unit: string;
  stock: number;
  isAvailable: boolean;
  images: string[];
  specifications?: ProductSpecifications;
  nutritionInfo?: NutritionInfo;
  rating: number;
  reviewCount: number;
  sellerId: string;
  categoryId: string;
  category?: Category;
  tags?: string[];
  isFeatured: boolean;
  isOrganic: boolean;
  isHalal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpecifications {
  weight?: string;
  age?: string;
  breed?: string;
  origin?: string;
  certification?: string[];
}

export interface NutritionInfo {
  protein?: string;
  fat?: string;
  calories?: string;
  vitamins?: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  attributes?: CategoryAttributes;
}

export interface CategoryAttributes {
  required?: string[];
  optional?: string[];
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  deliveryFee: number;
  discount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: Address;
  deliveryTime?: DeliveryTime;
  trackingInfo?: TrackingInfo;
  deliveryPartnerId?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa' | 'stripe';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface DeliveryTime {
  preferred?: string;
  scheduled?: string;
}

export interface TrackingInfo {
  status: string;
  location?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  productImage?: string;
  specifications?: ProductSpecifications;
}

// Cart types
export interface CartItem {
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  unit: string;
  specifications?: ProductSpecifications;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Form types
export interface LoginForm {
  phone: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}
