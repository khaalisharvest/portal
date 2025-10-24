'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  unit: string;
  specifications?: any;
  isAvailable: boolean;
  selectedVariant?: string;
  variantPrice?: number;
  variantOriginalPrice?: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string; selectedVariant?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; selectedVariant?: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  error: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      // Find existing item with same productId AND same variant
      const existingItem = state.items.find(item => 
        item.productId === action.payload.productId && 
        item.selectedVariant === action.payload.selectedVariant
      );
      let newItems: CartItem[];

      if (existingItem) {
        // Same product with same variant - increase quantity
        newItems = state.items.map(item =>
          item.productId === action.payload.productId && 
          item.selectedVariant === action.payload.selectedVariant
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        // Different product or different variant - add as new item
        newItems = [...state.items, action.payload];
      }

      const totalItems = newItems.length; // Count unique products, not total quantity
      const totalPrice = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(item => 
        !(item.productId === action.payload.productId && 
          item.selectedVariant === action.payload.selectedVariant)
      );
      const totalItems = newItems.length; // Count unique products, not total quantity
      const totalPrice = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.productId === action.payload.productId && 
        item.selectedVariant === action.payload.selectedVariant
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);

      const totalItems = newItems.length; // Count unique products, not total quantity
      const totalPrice = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'LOAD_CART': {
      const totalItems = action.payload.length; // Count unique products, not total quantity
      const totalPrice = action.payload.reduce((total, item) => total + (item.price * item.quantity), 0);

      return {
        ...state,
        items: action.payload,
        totalItems,
        totalPrice,
      };
    }

    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (productId: string, selectedVariant?: string) => void;
  updateQuantity: (productId: string, selectedVariant: string | undefined, quantity: number) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const savedCart = localStorage.getItem('cart');
      
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        
        // Validate that the parsed data is an array
        if (Array.isArray(cartItems)) {
          // Sanitize cart items to ensure numeric values are properly typed
          const sanitizedItems = cartItems.map(item => ({
            ...item,
            price: Number(item.price),
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            variantPrice: item.variantPrice ? Number(item.variantPrice) : undefined,
            variantOriginalPrice: item.variantOriginalPrice ? Number(item.variantOriginalPrice) : undefined,
            quantity: Number(item.quantity)
          }));
          dispatch({ type: 'LOAD_CART', payload: sanitizedItems });
        } else {
          localStorage.removeItem('cart');
        }
      }
    } catch (error) {
      // Clear corrupted cart data
      localStorage.removeItem('cart');
    } finally {
      // Mark as initialized after loading attempt
      setIsInitialized(true);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Save cart to localStorage whenever it changes (but only after initialization)
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    
    try {
      const cartData = JSON.stringify(state.items);
      localStorage.setItem('cart', cartData);
    } catch (error) {
      // Silently handle localStorage errors
    }
  }, [state.items, isInitialized]);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const cartItem: CartItem = {
      ...item,
      id: `${item.productId}-${Date.now()}`,
    };
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  };

  const removeFromCart = (productId: string, selectedVariant?: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId, selectedVariant } });
  };

  const updateQuantity = (productId: string, selectedVariant: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedVariant);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, selectedVariant, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    // Also clear from localStorage
    try {
      localStorage.removeItem('cart');
    } catch (error) {
      // Silently handle localStorage errors
    }
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const refreshCart = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        if (Array.isArray(cartItems)) {
          dispatch({ type: 'LOAD_CART', payload: cartItems });
        } else {
          localStorage.removeItem('cart');
        }
      }
    } catch (error) {
      // Silently handle localStorage errors
    }
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setLoading,
        setError,
        clearError,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export type { CartItem };
