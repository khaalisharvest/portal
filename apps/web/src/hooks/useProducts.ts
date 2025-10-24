import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { 
  setLoading, 
  setProducts, 
  setFeaturedProducts, 
  setCategories, 
  setError 
} from '@/store/slices/productSlice';
import { api } from '@/services/api';
import { productTypesApi } from '@/services/productTypes';

export const useProducts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, isLoading, error } = useSelector((state: RootState) => state.product);

  const fetchProducts = async () => {
    try {
      dispatch(setLoading(true));
      const data = await api.getProducts();
      dispatch(setProducts(data));
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to fetch products'));
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const data = await api.getFeaturedProducts();
      dispatch(setFeaturedProducts(data));
    } catch (err) {
      // Error fetching featured products
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      dispatch(setCategories(data));
    } catch (err) {
      // Error fetching categories
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchFeaturedProducts();
    fetchCategories();
  }, []);

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  };
};

export const useFeaturedProducts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { featuredProducts } = useSelector((state: RootState) => state.product);

  const fetchFeaturedProducts = async () => {
    try {
      const data = await api.getFeaturedProducts();
      dispatch(setFeaturedProducts(data));
    } catch (err) {
      // Error fetching featured products
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  return {
    featuredProducts,
    refetch: fetchFeaturedProducts,
  };
};

export const useCategories = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { categories } = useSelector((state: RootState) => state.product);

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      dispatch(setCategories(data));
    } catch (err) {
      // Error fetching categories
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    refetch: fetchCategories,
  };
};

export const useProductTypes = () => {
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProductTypes = async () => {
    try {
      setIsLoading(true);
      const data = await productTypesApi.getAll();
      setProductTypes(data);
    } catch (err) {
      console.error('Error fetching product types:', err);
      setProductTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  return {
    productTypes,
    isLoading,
    refetch: fetchProductTypes,
  };
};
