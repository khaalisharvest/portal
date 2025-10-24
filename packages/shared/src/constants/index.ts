// API Constants
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:id',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    FEATURED: '/products/featured',
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    DETAIL: '/orders/:id',
    UPDATE: '/orders/:id',
    CANCEL: '/orders/:id/cancel',
  },
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    UPDATE: '/cart/update',
    REMOVE: '/cart/remove',
    CLEAR: '/cart/clear',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/profile',
  },
  SELLERS: {
    LIST: '/sellers',
    DETAIL: '/sellers/:id',
    PRODUCTS: '/sellers/:id/products',
  },
  FARMERS: {
    LIST: '/farmers',
    DETAIL: '/farmers/:id',
    PRODUCTS: '/farmers/:id/products',
  },
  VETS: {
    LIST: '/vets',
    DETAIL: '/vets/:id',
    BOOK: '/vets/:id/book',
  },
  LOGISTICS: {
    TRACK: '/logistics/track/:orderId',
    ESTIMATE: '/logistics/estimate',
  },
  PAYMENTS: {
    PROCESS: '/payments/process',
    VERIFY: '/payments/verify',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
  },
} as const;

// Request Configuration
export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryMultiplier: 2,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  FARMER: 'farmer',
  VET: 'vet',
  LOGISTICS: 'logistics',
  ADMIN: 'admin',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  COD: 'cod',
  JAZZCASH: 'jazzcash',
  EASYPAISA: 'easypaisa',
  STRIPE: 'stripe',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Product Categories
export const PRODUCT_CATEGORIES = {
  MEAT: 'meat',
  DAIRY: 'dairy',
  POULTRY: 'poultry',
  SEAFOOD: 'seafood',
  ORGANIC: 'organic',
  FROZEN: 'frozen',
} as const;

// Units
export const UNITS = {
  KG: 'kg',
  LITER: 'liter',
  PIECE: 'piece',
  DOZEN: 'dozen',
  GRAM: 'gram',
  POUND: 'pound',
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 5,
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PHONE_LENGTH: 10,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500,
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  CART: 'cart',
  ORDERS: 'orders',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  CART_DATA: 'cart_data',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  ORDER_PLACED: 'Order placed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  CART_UPDATED: 'Cart updated successfully!',
  PAYMENT_SUCCESS: 'Payment successful!',
} as const;

// Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Languages
export const LANGUAGES = {
  EN: 'en',
  UR: 'ur',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm',
} as const;

// Rating
export const RATING = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 0,
} as const;

// Delivery
export const DELIVERY = {
  FREE_DELIVERY_MIN_ORDER: 2000, // PKR
  DELIVERY_FEE: 150, // PKR
  ESTIMATED_DELIVERY_TIME: 2, // hours
} as const;
