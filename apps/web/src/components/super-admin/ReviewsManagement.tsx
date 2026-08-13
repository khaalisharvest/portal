'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonCard } from '@/components/admin/AdminSkeletonRow';

type ReviewStatus = 'pending' | 'approved' | 'rejected';
type FilterTab    = 'all' | ReviewStatus;

interface ReviewProduct { id: string; name: string; images?: string[] }
interface ReviewUser    { id: string; name: string; phone?: string }
interface Review {
  id: string; productId: string; userId: string;
  rating: number; title?: string; comment?: string;
  status: ReviewStatus; isVerified: boolean; createdAt: string;
  product?: ReviewProduct; user?: ReviewUser;
}
interface Stats { pending: number; approved: number; rejected: number }

interface CategoryWithTypes { id: string; name: string; productTypes: { id: string; name: string; displayName?: string }[] }
interface ProductType       { id: string; name: string }
interface Product           { id: string; name: string; images?: string[] }

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-yellow-400' : 'text-neutral-200'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending:  'bg-secondary-50 text-secondary-700 border-secondary-200',
  approved: 'bg-primary-50  text-primary-700  border-primary-200',
  rejected: 'bg-error-50    text-error-600    border-error-200',
};
const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
};

// ── Cascaded filter bar ───────────────────────────────────────────────────────

function SelectFilter({
  label, value, onChange, options, disabled, placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      {label && <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</span>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`text-sm border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all ${
          disabled ? 'opacity-40 cursor-not-allowed border-neutral-200' : 'border-neutral-200 cursor-pointer'
        } ${value ? 'border-primary-300 text-neutral-900' : 'text-neutral-400'}`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReviewsManagement() {
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [stats, setStats]         = useState<Stats>({ pending: 0, approved: 0, rejected: 0 });
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [page, setPage]           = useState(1);
  const LIMIT = 20;

  // cascaded filter state
  const [categoriesData, setCategoriesData] = useState<CategoryWithTypes[]>([]);
  const [products,       setProducts]       = useState<Product[]>([]);
  const [catId,          setCatId]          = useState('');
  const [typeId,         setTypeId]         = useState('');
  const [productId,      setProductId]      = useState('');
  const [prodsLoading,   setProdsLoading]   = useState(false);

  // confirmation dialog
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const [isDeleting,    setIsDeleting]    = useState(false);

  // ── Load categories + their embedded productTypes in one call ────────────

  useEffect(() => {
    fetch('/api/v1/products/categories-with-types', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(json => {
        const raw  = json.data ?? json;
        const list = Array.isArray(raw) ? raw : [];
        setCategoriesData(list.map((c: any) => ({
          id:   c.id,
          name: c.name,
          productTypes: (Array.isArray(c.productTypes) ? c.productTypes : []).map((t: any) => ({
            id:   t.id,
            name: t.displayName || t.name || t.id,
          })),
        })));
      })
      .catch(() => {});
  }, []);

  // ── Derive types from selected category (no extra fetch needed) ──────────

  const availableTypes: ProductType[] = catId
    ? (categoriesData.find(c => c.id === catId)?.productTypes ?? [])
    : [];

  // ── Load products when category or type changes ───────────────────────────

  useEffect(() => {
    setProductId('');
    setProducts([]);
    if (!catId) return;
    setProdsLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    params.set('category', catId);
    if (typeId) params.set('type', typeId);
    fetch(`/api/v1/products/admin?${params}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { products: [] })
      .then((json: any) => {
        // Response is wrapped: { success, data: { products, total, ... }, timestamp }
        const raw  = json.data ?? json;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.products) ? raw.products : []);
        setProducts(list.map((p: any) => ({ id: p.id, name: p.name, images: p.images })));
      })
      .catch(() => {})
      .finally(() => setProdsLoading(false));
  }, [catId, typeId]);

  // ── Fetch reviews ─────────────────────────────────────────────────────────

  const fetchReviews = useCallback(async (tab: FilterTab, p: number, pid?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab, page: String(p), limit: String(LIMIT) });
      if (pid) params.set('productId', pid);
      const res  = await fetch(`/api/v1/admin/reviews?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load reviews');
      const json = await res.json();
      const data = json.data ?? json;
      setReviews(data.reviews ?? []);
      setTotal(data.total ?? 0);
      setStats(data.stats ?? { pending: 0, approved: 0, rejected: 0 });
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(activeTab, page, productId || undefined);
  }, [activeTab, page, productId, fetchReviews]);

  const handleTabChange = (tab: FilterTab) => { setActiveTab(tab); setPage(1); };

  const clearFilters = () => {
    setCatId(''); setTypeId(''); setProductId('');
    setPage(1); setActiveTab('all');
  };

  const handleStatus = async (review: Review, status: ReviewStatus) => {
    try {
      const res = await fetch(`/api/v1/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Review ${status === 'approved' ? 'approved' : 'rejected'}`);
      fetchReviews(activeTab, page, productId || undefined);
    } catch {
      toast.error('Failed to update review');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/reviews/${confirmDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success('Review deleted');
      fetchReviews(activeTab, page, productId || undefined);
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  const totalPages    = Math.ceil(total / LIMIT);
  const hasFilter     = Boolean(catId || productId);
  const selectedProd  = products.find(p => p.id === productId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Reviews' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: stats.pending + stats.approved + stats.rejected, color: 'text-neutral-700', bg: 'bg-neutral-50 border-neutral-200' },
          { label: 'Pending',  value: stats.pending,  color: 'text-secondary-700', bg: 'bg-secondary-50 border-secondary-200' },
          { label: 'Approved', value: stats.approved, color: 'text-primary-700',   bg: 'bg-primary-50 border-primary-200'   },
          { label: 'Rejected', value: stats.rejected, color: 'text-error-600',     bg: 'bg-error-50 border-error-200'       },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              {s.label}{selectedProd ? ` · ${selectedProd.name}` : ''}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter panel ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">

          {/* Category */}
          <SelectFilter
            label="Category"
            value={catId}
            onChange={v => { setCatId(v); setTypeId(''); setProductId(''); setPage(1); setActiveTab('all'); }}
            options={categoriesData.map(c => ({ id: c.id, name: c.name }))}
            placeholder="All categories"
          />

          {/* Product type — derived from selected category, no extra fetch */}
          <SelectFilter
            label="Product Type"
            value={typeId}
            onChange={v => { setTypeId(v); setProductId(''); setPage(1); }}
            options={availableTypes}
            disabled={!catId || availableTypes.length === 0}
            placeholder={!catId ? 'Select category first' : availableTypes.length === 0 ? 'No types' : 'All types'}
          />

          {/* Product */}
          <SelectFilter
            label="Product"
            value={productId}
            onChange={v => { setProductId(v); setPage(1); }}
            options={products}
            disabled={!catId || prodsLoading}
            placeholder={!catId ? 'Select category first' : prodsLoading ? 'Loading…' : products.length === 0 ? 'No products' : 'All products'}
          />

          {/* Clear button */}
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-error-600 border border-neutral-200 hover:border-error-200 rounded-xl transition-colors bg-white"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Clear filters
            </button>
          )}

          {/* Active filter badge */}
          {selectedProd && (
            <div className="flex items-center gap-2 ml-auto px-3 py-2 bg-primary-50 border border-primary-200 rounded-xl">
              {selectedProd.images?.[0] && (
                <Image src={selectedProd.images[0]} alt="" width={20} height={20}
                  className="w-5 h-5 rounded object-cover" />
              )}
              <span className="text-xs font-semibold text-primary-700">{selectedProd.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${
              activeTab === tab.key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && stats.pending > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-secondary-500 text-white rounded-full">
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <AdminSkeletonCard key={i} />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <p className="text-sm font-medium">
            No {activeTab === 'all' ? '' : activeTab} reviews
            {selectedProd ? ` for "${selectedProd.name}"` : ''}
          </p>
          {hasFilter && (
            <button onClick={clearFilters} className="mt-2 text-xs text-primary-500 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
              <div className="flex items-start gap-4">

                {/* Product thumbnail */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50">
                  {review.product?.images?.[0] ? (
                    <Image src={review.product.images[0]} alt={review.product.name ?? ''}
                      width={48} height={48} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-xs text-neutral-400 truncate">
                        {review.product?.name ?? review.productId}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-800">
                          {review.user?.name ?? 'Unknown user'}
                        </p>
                        {review.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-1.5 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            Verified Purchase
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${STATUS_STYLES[review.status]}`}>
                          {STATUS_LABEL[review.status]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <StarRow rating={review.rating} />
                      <span className="text-xs text-neutral-400 ml-1">
                        {new Date(review.createdAt).toLocaleDateString('en-PK', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  {review.title   && <p className="text-sm font-semibold text-neutral-800 mb-0.5">{review.title}</p>}
                  {review.comment && <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-50">
                {review.status !== 'approved' && (
                  <button onClick={() => handleStatus(review, 'approved')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                    Approve
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button onClick={() => handleStatus(review, 'rejected')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary-700 bg-secondary-50 hover:bg-secondary-100 border border-secondary-200 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                    </svg>
                    Reject
                  </button>
                )}
                <button onClick={() => setConfirmDelete(review)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-error-600 bg-error-50 hover:bg-error-100 border border-error-200 rounded-lg transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm font-medium border border-neutral-200 rounded-lg disabled:opacity-40 hover:bg-neutral-50 transition-colors">
            ← Prev
          </button>
          <span className="text-sm text-neutral-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-medium border border-neutral-200 rounded-lg disabled:opacity-40 hover:bg-neutral-50 transition-colors">
            Next →
          </button>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        message={`Permanently delete this review by ${confirmDelete?.user?.name ?? 'this user'}? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
