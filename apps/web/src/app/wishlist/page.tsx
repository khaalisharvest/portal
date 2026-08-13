'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import ProductLoader from '@/components/ui/ProductLoader';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images: string[];
    unit: string;
    isAvailable: boolean;
    category?: { name: string };
  };
}

export default function WishlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/wishlist');
      return;
    }
    if (user) fetchWishlist();
  }, [user, authLoading]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/v1/wishlist', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || err?.error || `${res.status}`);
      }
      const json = await res.json();
      const items = json?.data ?? json;
      setWishlist(Array.isArray(items) ? items : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const res = await fetch(`/api/v1/wishlist/${productId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setWishlist(prev => prev.filter(item => item.productId !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Could not remove from wishlist. Please try again.');
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    addToCart({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images?.[0] || '/images/placeholder.svg',
      unit: item.product.unit,
      quantity: 1,
      isAvailable: item.product.isAvailable,
    });
    toast.success(`${item.product.name} added to basket`, {
      duration: 3500,
      action: { label: 'View Basket', onClick: () => router.push('/cart') },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProductLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-100">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-neutral-900 font-medium">Wishlist</span>
          </nav>
        </div>
      </div>
      <div className="container-custom py-6 sm:py-8">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-neutral-900">My Wishlist</h1>
          <p className="text-neutral-500 mt-1 text-sm">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary-50 flex items-center justify-center mb-5">
              <svg className="w-9 h-9 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your wishlist is empty</h2>
            <p className="text-neutral-500 text-sm mb-7">Save products you love and find them here later</p>
            <Link href="/products" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden group border border-neutral-100 hover:shadow-md transition-shadow duration-200"
              >
                {/* Image — aspect-ratio based so it scales with card width */}
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.product.images?.[0] || '/images/placeholder.svg'}
                    alt={item.product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                  />
                  {/* Remove button — labelled for clarity */}
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-error-50 hover:text-error-500 text-neutral-500 transition-colors text-xs font-medium"
                    title="Remove from wishlist"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Remove
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-xs text-primary-600 font-medium mb-1">{item.product.category?.name}</p>
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors line-clamp-2 text-sm sm:text-base">{item.product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-2 mb-4">
                    <span className="text-lg font-bold text-neutral-900">₨{item.product.price.toLocaleString('en-PK')}</span>
                    {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                      <span className="text-sm text-neutral-400 line-through">₨{item.product.originalPrice.toLocaleString('en-PK')}</span>
                    )}
                    <span className="text-xs text-neutral-500">/{item.product.unit}</span>
                  </div>
                  <button
                    onClick={() => item.product.isAvailable && handleAddToCart(item)}
                    disabled={!item.product.isAvailable}
                    className="w-full btn-primary text-sm text-center block disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {item.product.isAvailable ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
