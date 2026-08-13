'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HeartIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

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
  const [isFavorited, setIsFavorited] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to save to wishlist');
      return;
    }
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      await fetch(`/api/v1/wishlist/${product.id}`, {
        method: 'POST',
        credentials: 'include',
      });
      setIsFavorited(prev => !prev);
      toast.success(isFavorited ? 'Removed from wishlist' : 'Added to wishlist');
    } catch {
      toast.error('Failed to update wishlist');
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
        
        {user && (
          <button
            onClick={handleFavorite}
            disabled={wishlistLoading}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 disabled:opacity-50"
            title={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isFavorited ? (
              <HeartSolidIcon className="h-5 w-5 text-error-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-neutral-400" />
            )}
          </button>
        )}

        {product.isOrganic && (
          <span className="absolute bottom-2 left-2 bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-full">
            Organic
          </span>
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

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-base sm:text-lg font-bold text-neutral-900">
              ₨{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs sm:text-sm text-neutral-400 line-through">
                ₨{product.originalPrice}
              </span>
            )}
            {product.unit && (
              <span className="text-xs sm:text-sm text-neutral-500">/{product.unit}</span>
            )}
          </div>
        </div>

        <button
          className="w-full bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-1.5 px-2 rounded-lg transition-colors duration-200 mt-1 text-xs"
          onClick={(e) => { e.stopPropagation(); router.push(`/products/${product.id}`); }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
