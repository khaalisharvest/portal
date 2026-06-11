// ============================================================
// Shared types between frontend and backend.
// Mirror backend entity/DTO shapes exactly.
// Update here when backend entity fields change.
// ============================================================

export type UserRole = 'customer' | 'staff' | 'super_admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  profileImage?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'draft' | 'active' | 'archived';
export type InventoryType = 'marketplace' | 'warehouse';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  unit: string;
  images: string[];
  categoryId: string;
  productTypeId?: string;
  category?: Category;
  productType?: ProductType;
  inventory?: Inventory[];
  specifications?: Record<string, unknown>;
  status: ProductStatus;
  inventoryType: InventoryType;
  isAvailable: boolean;
  featured: boolean;
  isOrganic: boolean;
  hasVariants: boolean;
  variantName?: string;
  variants?: ProductVariant[];
  tags?: string[];
  marketplaceInfo?: { supplierName?: string; supplierContact?: string };
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  name: string;
  price: number;
  originalPrice?: number;
  isAvailable: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductType {
  id: string;
  name: string;
  displayName: string;
  color?: string;
  unit?: string;
  categoryId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStock: number;
  maximumStock: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
  isActive: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod =
  | 'cash_on_delivery'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'digital_wallet';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'email'>;
  address: OrderAddress;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  cancelledAt?: string;
  cancelReason?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  itemName: string;
  itemImage: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  unit: string;
}

export interface OrderAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: 'home' | 'work' | 'other';
  instructions?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  adminResponse?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
}
