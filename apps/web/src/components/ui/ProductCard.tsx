'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { StarIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  unit?: string;
  images?: string[];
  image?: string;
  rating?: number;
  reviewCount?: number;
  isOrganic?: boolean;
  specifications?: Record<string, any>;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited]     = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Sync wishlist state from server whenever user or product changes
  useEffect(() => {
    if (!user) { setIsFavorited(false); return; }
    fetch(`/api/v1/wishlist/${product.id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json) return;
        const d = json?.data ?? json;
        setIsFavorited(d?.isWishlisted ?? false);
      })
      .catch(() => {});
  }, [user, product.id]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save to wishlist');
      return;
    }
    if (wishlistLoading) return;
    setWishlistLoading(true);
    const optimistic = !isFavorited;
    setIsFavorited(optimistic);
    try {
      const res = await fetch(`/api/v1/wishlist/${product.id}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      // Sync to server truth — backend returns { added: true/false }
      const actual = (json?.data ?? json)?.added ?? optimistic;
      setIsFavorited(actual);
      toast.success(actual ? 'Added to wishlist' : 'Removed from wishlist', {
        action: actual ? { label: 'View Wishlist', onClick: () => router.push('/wishlist') } : undefined,
      });
    } catch {
      setIsFavorited(!optimistic); // revert
      toast.error('Could not update wishlist. Please try again.');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-neutral-100 cursor-pointer w-full"
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <div className="relative mb-2">
        <div className="aspect-w-1 aspect-h-1 bg-neutral-200 rounded-lg overflow-hidden">
          <Image
            src={product.images?.[0] || product.image || '/images/placeholder.svg'}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-32 sm:h-36 md:h-40 object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
          />
        </div>

        {product.isOrganic && (
          <span className="absolute bottom-2 left-2 bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-full">
            Organic
          </span>
        )}

        {/* Wishlist button — prominent pill in top-right corner */}
        {user && (
          <button
            onClick={handleFavorite}
            disabled={wishlistLoading}
            className={`absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all duration-200 disabled:opacity-60 ${
              isFavorited
                ? 'bg-error-500 text-white'
                : 'bg-white text-neutral-600 hover:bg-error-50 hover:text-error-500'
            }`}
            title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            {wishlistLoading ? (
              <span className="w-3 h-3 border-2 border-current/40 border-t-current rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
            <span>{isFavorited ? 'Saved' : 'Save'}</span>
          </button>
        )}
      </div>

      <div className="space-y-1 px-2 py-2">
        <h3 className="text-sm sm:text-base font-semibold text-neutral-900">{product.name}</h3>

        {product.rating && product.reviewCount && product.reviewCount > 0 && (
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating!)
                      ? 'text-yellow-400 fill-current'
                      : 'text-neutral-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-neutral-500">
              {product.rating} ({product.reviewCount})
            </span>
          </div>
        )}

        <div className="flex items-center space-x-1 sm:space-x-2">
          <span className="text-base sm:text-lg font-bold text-neutral-900">
            ₨{Number(product.price).toLocaleString('en-PK')}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs sm:text-sm text-neutral-400 line-through">
              ₨{Number(product.originalPrice).toLocaleString('en-PK')}
            </span>
          )}
          {product.unit && (
            <span className="text-xs sm:text-sm text-neutral-500">/{product.unit}</span>
          )}
        </div>

        <button
          className="w-full flex items-center justify-center gap-1.5 bg-secondary-500 hover:bg-secondary-600 active:bg-secondary-700 text-white font-semibold py-2 px-2 rounded-xl transition-colors duration-150 mt-1 text-xs shadow-sm"
          onClick={(e) => { e.stopPropagation(); router.push(`/products/${product.id}`); }}
        >
          <ShoppingCartIcon className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
