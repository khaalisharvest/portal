'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonRow } from '@/components/admin/AdminSkeletonRow';

interface SavedByUser {
  id: string;
  name: string;
  phone: string;
  savedAt: string;
}

interface WishlistProduct {
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
    isAvailable: boolean;
    category?: { name: string };
  };
  wishlistCount: number;
  savedBy: SavedByUser[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
}

function UserChips({ users }: { users: SavedByUser[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? users : users.slice(0, 4);
  const remaining = users.length - 4;

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {visible.map(u => (
        <div
          key={u.id}
          title={`${u.name} · ${u.phone} · Saved ${timeAgo(u.savedAt)}`}
          className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-full px-2.5 py-1 text-xs text-neutral-700"
        >
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-semibold text-[10px] leading-none">
              {u.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium">{u.name}</span>
          <span className="text-neutral-400">{u.phone}</span>
          <span className="text-neutral-300">·</span>
          <span className="text-neutral-400">{timeAgo(u.savedAt)}</span>
        </div>
      ))}
      {!expanded && remaining > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded-full bg-primary-50 border border-primary-100 transition-colors"
        >
          +{remaining} more
        </button>
      )}
      {expanded && users.length > 4 && (
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-neutral-400 hover:text-neutral-600 font-medium"
        >
          Show less
        </button>
      )}
    </div>
  );
}

export default function WishlistManagement() {
  const [items, setItems]         = useState<WishlistProduct[]>([]);
  const [total, setTotal]         = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/admin/wishlist', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/v1/admin/wishlist/stats', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([popular, stats]) => {
        const list = popular?.data ?? popular;
        const stat = stats?.data ?? stats;
        setItems(Array.isArray(list) ? list : []);
        setTotal(stat?.total ?? 0);
      })
      .catch(() => toast.error('Failed to load wishlist data'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = items.filter(i =>
    !search ||
    i.product.name.toLowerCase().includes(search.toLowerCase()) ||
    i.product.category?.name.toLowerCase().includes(search.toLowerCase()) ||
    i.savedBy.some(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
    )
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wishlist Insights"
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Wishlist' }]}
        action={
          <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2">
            <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-semibold text-primary-700">{total.toLocaleString()} total saves</span>
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          placeholder="Search product, customer name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <AdminSkeletonRow key={i} cols={4} />)}</tbody></table>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-10 h-10 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-neutral-500 text-sm">{search ? 'No results match your search' : 'No wishlist data yet'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wide w-8">#</th>
                    <th className="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Product</th>
                    <th className="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Category</th>
                    <th className="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Price</th>
                    <th className="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Saves</th>
                    <th className="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Saved by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map((item, idx) => (
                    <tr key={item.product.id} className="hover:bg-neutral-50/60 transition-colors align-top">
                      <td className="px-5 py-4 text-neutral-400 text-xs font-mono">{idx + 1}</td>

                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                            <Image
                              src={item.product.images?.[0] || '/images/placeholder.svg'}
                              alt={item.product.name}
                              width={40} height={40}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                            />
                          </div>
                          <span className="font-medium text-neutral-900 line-clamp-1 max-w-[160px]">
                            {item.product.name}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 text-neutral-500 whitespace-nowrap">
                        {item.product.category?.name ?? <span className="text-neutral-300">—</span>}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 font-medium text-neutral-900 whitespace-nowrap">
                        ₨{item.product.price.toLocaleString('en-PK')}
                      </td>

                      {/* Stock status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                          item.product.isAvailable
                            ? 'bg-primary-50 text-primary-700 border-primary-200'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.product.isAvailable ? 'bg-primary-500' : 'bg-neutral-400'}`} />
                          {item.product.isAvailable ? 'In stock' : 'Out of stock'}
                        </span>
                      </td>

                      {/* Save count badge */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1 bg-error-50 text-error-600 border border-error-100 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {item.wishlistCount}
                        </div>
                      </td>

                      {/* Saved by users */}
                      <td className="px-5 py-4 max-w-xs">
                        {item.savedBy.length === 0 ? (
                          <span className="text-neutral-300 text-xs">—</span>
                        ) : (
                          <UserChips users={item.savedBy} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-neutral-100 text-xs text-neutral-400">
              Showing {filtered.length} of {items.length} products · sorted by most saved
            </div>
          </>
        )}
      </div>
    </div>
  );
}
