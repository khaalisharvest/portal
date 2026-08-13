'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CategoryTabs from '@/components/ui/CategoryTabs';
import ProductLoader from '@/components/ui/ProductLoader';
import Icon from '@/components/ui/Icon';
import { useFilter } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  productTypeId?: string;
  specifications?: Record<string, any>;
  isOrganic: boolean;
  isAvailable: boolean;
  unit: string;
  featured: boolean;
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
  productTypes?: ProductType[];
}

interface ProductType {
  id: string;
  displayName: string;
  description?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  category?: Category;
}

interface ProductsSectionProps {
  showOnly?: number;
  showPagination?: boolean;
  className?: string;
}

/** Sliding-window page numbers. Returns numbers and '…' sentinels. */
function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  const lo = Math.max(2, current - 1);
  const hi = Math.min(total - 1, current + 1);
  for (let p = lo; p <= hi; p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export default function ProductsSection({
  showOnly,
  showPagination = false,
  className = '',
}: ProductsSectionProps) {
  const { selectedCategory, selectedProductType } = useFilter();
  const { user } = useAuth();
  const { refresh: refreshWishlistCount } = useWishlist();

  // Per-card wishlist state: productId → boolean
  const [wishlistMap, setWishlistMap] = useState<Record<string, boolean>>({});
  const [wishlistLoading, setWishlistLoading] = useState<Record<string, boolean>>({});

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected filter state (drives CategoryTabs highlighting + fetches)
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const [activeTypeIds, setActiveTypeIds] = useState<string[]>([]);

  // Prevent double-fetch on mount from the external-filter effect
  const externalFilterRef = useRef({ cat: selectedCategory, type: selectedProductType });

  // ── initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProducts(1, [], [], '', true);
  }, []);

  // ── external filter (mobile dropdown / FilterContext) ────────────────────
  useEffect(() => {
    const prev = externalFilterRef.current;
    if (prev.cat === selectedCategory && prev.type === selectedProductType) return;
    externalFilterRef.current = { cat: selectedCategory, type: selectedProductType };

    const cats = selectedCategory ? [selectedCategory] : [];
    const types = selectedProductType ? [selectedProductType] : [];
    setActiveCategoryIds(cats);
    setActiveTypeIds(types);
    setCurrentPage(1);
    fetchProducts(1, cats, types, searchTerm);
  }, [selectedCategory, selectedProductType]);

  // ── data fetcher ─────────────────────────────────────────────────────────
  const fetchProducts = async (
    page: number,
    cats: string[],
    types: string[],
    search: string,
    isInitial = false,
  ) => {
    setError(null);
    try {
      if (isInitial) setLoading(true);
      else setFilterLoading(true);

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(showOnly ?? 12));
      if (cats.length)   params.set('category', cats.join(','));
      if (types.length)  params.set('type', types.join(','));
      if (search)        params.set('search', search);

      const res  = await fetch(`/api/public/products?${params}`);
      const data = await res.json();

      if (data.success) {
        const fetched: Product[] = data.data.products ?? [];
        setProducts(fetched);
        if (Array.isArray(data.data.categories))   setCategories(data.data.categories);
        if (Array.isArray(data.data.productTypes)) setProductTypes(data.data.productTypes);
        const limit = showOnly ?? 12;
        const total = data.data.total ?? 0;
        setTotalPages(Math.ceil(total / limit));
        setTotalProducts(total);

        // Fetch wishlist status for these products if logged in
        if (user && fetched.length > 0) {
          Promise.allSettled(
            fetched.map(p =>
              fetch(`/api/v1/wishlist/${p.id}`, { credentials: 'include' })
                .then(r => r.ok ? r.json() : null)
                .then(json => {
                  const d = json?.data ?? json;
                  return { id: p.id, wishlisted: d?.isWishlisted ?? false };
                })
            )
          ).then(results => {
            const map: Record<string, boolean> = {};
            results.forEach(r => { if (r.status === 'fulfilled' && r.value) map[r.value.id] = r.value.wishlisted; });
            setWishlistMap(map);
          });
        }
      }
    } catch {
      setError('Failed to load products');
    } finally {
      if (isInitial) setLoading(false);
      else setFilterLoading(false);
    }
  };

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleCategoryChange = (value: string | string[]) => {
    const cats = Array.isArray(value) ? value : value ? [value] : [];
    setActiveCategoryIds(cats);
    setActiveTypeIds([]);          // clear type when category changes
    setCurrentPage(1);
    fetchProducts(1, cats, [], searchTerm);
  };

  const handleTypeChange = (value: string | string[]) => {
    const types = Array.isArray(value) ? value : value ? [value] : [];
    setActiveTypeIds(types);
    setCurrentPage(1);
    fetchProducts(1, activeCategoryIds, types, searchTerm);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      if (hasSearched) {
        // Clear the search — reload without search term
        setHasSearched(false);
        fetchProducts(1, activeCategoryIds, activeTypeIds, '');
      }
      return;
    }
    setHasSearched(true);
    setCurrentPage(1);
    fetchProducts(1, activeCategoryIds, activeTypeIds, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setHasSearched(false);
    setCurrentPage(1);
    fetchProducts(1, activeCategoryIds, activeTypeIds, '');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setHasSearched(false);
    setActiveCategoryIds([]);
    setActiveTypeIds([]);
    setCurrentPage(1);
    fetchProducts(1, [], [], '', true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(page, activeCategoryIds, activeTypeIds, searchTerm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWishlistToggle = useCallback(async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Sign in to save to wishlist'); return; }
    if (wishlistLoading[productId]) return;
    const optimistic = !wishlistMap[productId];
    setWishlistMap(prev => ({ ...prev, [productId]: optimistic }));
    setWishlistLoading(prev => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`/api/v1/wishlist/${productId}`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const actual = (json?.data ?? json)?.added ?? optimistic;
      setWishlistMap(prev => ({ ...prev, [productId]: actual }));
      refreshWishlistCount();
      toast.success(actual ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {
      setWishlistMap(prev => ({ ...prev, [productId]: !optimistic }));
      toast.error('Could not update wishlist');
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
  }, [user, wishlistMap, wishlistLoading, refreshWishlistCount]);

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <ProductLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <p className="text-error-500 text-sm">{error} Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="pt-4 mb-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search for organic products…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-4 py-3 pl-10 pr-12 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          />
          {hasSearched && searchTerm ? (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-error-500 transition-colors"
              title="Clear search"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSearch}
              disabled={!searchTerm.trim()}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={searchTerm.trim() ? 'Search' : 'Enter search term'}
            >
              <Icon name="search" className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        productTypes={productTypes}
        selectedCategory={activeCategoryIds[0] ?? ''}
        selectedProductType={activeTypeIds[0] ?? ''}
        onCategoryChange={handleCategoryChange}
        onProductTypeChange={handleTypeChange}
        onClearFilters={handleClearFilters}
        className="mb-6"
      />

      {/* Products Grid */}
      <div className={`relative transition-opacity duration-300 ${filterLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {/* Filter-change spinner — absolutely overlaid so it never shifts layout */}
        {filterLoading && (
          <div className="absolute inset-x-0 top-6 z-10 flex justify-center pointer-events-none">
            <ProductLoader size="sm" />
          </div>
        )}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <Image
                src="/images/logo.png"
                alt="Khaalis Harvest"
                fill
                sizes="48px"
                className="object-contain opacity-50"
              />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No organic products found</h3>
            <p className="text-neutral-500 text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className={`grid gap-3 sm:gap-4 ${
              showOnly
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {products.map((product, index) => {
                const priceNum  = Number(product.price);
                const safePrice = Number.isFinite(priceNum) ? priceNum : 0;
                const origNum   = product.originalPrice != null ? Number(product.originalPrice) : undefined;
                const hasDiscount = origNum != null && Number.isFinite(origNum) && origNum > safePrice;
                const discountPct = hasDiscount ? Math.round(((origNum! - safePrice) / origNum!) * 100) : 0;
                const isWishlisted = wishlistMap[product.id] ?? false;
                const isWishlistBusy = wishlistLoading[product.id] ?? false;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                    className="h-full"
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="group relative bg-white rounded-2xl border border-neutral-100 shadow-xs hover:shadow-md overflow-hidden flex flex-col h-full transition-shadow duration-200"
                    >
                      {/* ── Image ── */}
                      <div className="relative aspect-square overflow-hidden bg-neutral-50">
                        <Image
                          src={product.images?.[0] || '/images/placeholder.svg'}
                          alt={product.name}
                          fill
                          className={`object-cover group-hover:scale-105 transition-transform duration-500 ${!product.isAvailable ? 'opacity-60' : ''}`}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                        />

                        {/* Out of stock overlay */}
                        {!product.isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/20">
                            <span className="bg-neutral-900/70 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                              Out of Stock
                            </span>
                          </div>
                        )}

                        {/* Top-left badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {product.isOrganic && (
                            <span className="badge-organic text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              Organic
                            </span>
                          )}
                          {product.featured && !product.isOrganic && (
                            <span className="bg-secondary-100 text-secondary-700 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              Featured
                            </span>
                          )}
                        </div>

                        {/* Discount badge — top right */}
                        {hasDiscount && (
                          <span className="absolute top-2 right-2 bg-error-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                            -{discountPct}%
                          </span>
                        )}

                        {/* Wishlist heart — bottom right, only when no discount badge */}
                        {user && (
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => handleWishlistToggle(e, product.id)}
                            disabled={isWishlistBusy}
                            className={`absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-full shadow-md transition-all duration-150 ${
                              isWishlisted ? 'bg-error-500 text-white' : 'bg-white/90 text-neutral-400 hover:text-error-500'
                            }`}
                          >
                            {isWishlistBusy ? (
                              <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            )}
                          </motion.button>
                        )}
                      </div>

                      {/* ── Content ── */}
                      <div className="px-3 pt-3 pb-3.5 flex-1 flex flex-col gap-2">

                        {/* Name */}
                        <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 text-neutral-900 leading-snug">
                          {product.name}
                        </h3>

                        {/* Price block */}
                        <div className="mt-auto">
                          {hasDiscount && (
                            <div className="text-[10px] text-neutral-400 line-through tabular-nums">
                              ₨{origNum!.toLocaleString('en-PK')}
                            </div>
                          )}
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm sm:text-base font-bold text-neutral-900 tabular-nums">
                              ₨{safePrice.toLocaleString('en-PK')}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-neutral-400 font-medium">
                              /{product.unit}
                            </span>
                            {product.hasVariants && product.variants && product.variants.length > 0 && (
                              <span className="ml-auto text-[9px] text-neutral-400">
                                {product.variants.length} options
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {showPagination && totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-10">
                {/* Prev */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>

                {/* Page numbers — sliding window */}
                {getPageNumbers(currentPage, totalPages).map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-neutral-400 select-none">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`min-w-[2.25rem] px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        p === currentPage
                          ? 'bg-primary-500 text-white border border-primary-500 shadow-sm'
                          : 'text-neutral-700 bg-white border border-neutral-200 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}
