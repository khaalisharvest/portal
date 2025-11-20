/**
 * Cache key constants for consistent cache key management
 */
export const CACHE_KEYS = {
  PRODUCTS: {
    FEATURED: 'products:featured',
    CATEGORIES: 'products:categories',
    PRODUCT_TYPES: 'products:productTypes',
    BY_ID: (id: string) => `products:${id}`,
  },
  SETTINGS: {
    BY_KEY: (key: string) => `settings:${key}`,
    BY_CATEGORY: (category: string) => `settings_category:${category}`,
    ALL: 'all_settings',
  },
} as const;

