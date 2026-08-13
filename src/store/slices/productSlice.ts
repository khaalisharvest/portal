import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  productTypeId?: string;
  category?: { id: string; name: string };
  productType?: { id: string; displayName: string; color?: string };
  isOrganic: boolean;
  isAvailable: boolean;
  featured: boolean;
  unit: string;
  tags?: string[];
  hasVariants?: boolean;
  variantName?: string;
  variants?: Array<{ name: string; price: number; originalPrice?: number; isAvailable?: boolean }>;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

interface ProductState {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
}

const initialState: ProductState = {
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setProducts,
  setCategories,
  setError,
  setSearchQuery,
  setSelectedCategory,
  clearError,
} = productSlice.actions;

export default productSlice.reducer;
