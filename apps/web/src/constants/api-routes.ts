/**
 * Centralized BFF API route constants.
 * Reference these instead of inline strings to make route changes trackable.
 */
export const API = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    refresh: '/api/auth/refresh',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    profile: '/api/v1/auth/profile',
    changePassword: '/api/v1/auth/change-password',
  },
  products: {
    list: '/api/v1/products',
    admin: '/api/v1/products/admin',
    byId: (id: string) => `/api/v1/products/${id}`,
    uploadImage: '/api/v1/products/upload-image',
    categories: '/api/v1/products/categories',
    categoriesWithTypes: '/api/v1/products/categories-with-types',
    inventory: (productId: string) => `/api/v1/products/${productId}/inventory`,
  },
  categories: {
    list: '/api/v1/categories',
    byId: (id: string) => `/api/v1/categories/${id}`,
  },
  productTypes: {
    list: '/api/v1/product-types',
    byId: (id: string) => `/api/v1/product-types/${id}`,
  },
  orders: {
    list: '/api/v1/orders',
    byId: (id: string) => `/api/v1/orders/${id}`,
    addresses: '/api/v1/orders/addresses',
    addressById: (id: string) => `/api/v1/orders/addresses/${id}`,
    guestOrder: '/api/v1/orders/guest',
    adminList: '/api/v1/admin/orders',
    adminStatusById: (id: string) => `/api/v1/admin/orders/${id}/status`,
  },
  users: {
    customers: '/api/v1/admin/users/customers',
    statusById: (id: string) => `/api/v1/admin/users/${id}/status`,
  },
  staff: {
    list: '/api/v1/admin/staff',
    byId: (id: string) => `/api/v1/admin/staff/${id}`,
    statusById: (id: string) => `/api/v1/admin/staff/${id}/status`,
    activity: '/api/v1/admin/staff/activity',
    activityById: (id: string) => `/api/v1/admin/staff/${id}/activity`,
  },
  contacts: {
    list: '/api/v1/contacts',
    stats: '/api/v1/contacts/stats',
    byId: (id: string) => `/api/v1/contacts/${id}`,
    readById: (id: string) => `/api/v1/contacts/${id}/read`,
  },
  dashboard: {
    stats: '/api/v1/admin/dashboard',
  },
  settings: {
    delivery: '/api/v1/settings/delivery',
    payment: '/api/v1/settings/payment',
    contact: '/api/v1/settings/contact',
    social: '/api/v1/settings/social',
    store: '/api/v1/settings/store',
    orders: '/api/v1/settings/orders',
    notificationBar: '/api/v1/settings/notification-bar',
  },
  wishlist: {
    list: '/api/v1/wishlist',
    toggle: (productId: string) => `/api/v1/wishlist/${productId}`,
    check: (productId: string) => `/api/v1/wishlist/${productId}/check`,
  },
  reviews: {
    byProduct: (productId: string) => `/api/v1/products/${productId}/reviews`,
  },
  public: {
    settings: '/api/v1/public/settings',
  },
} as const;
