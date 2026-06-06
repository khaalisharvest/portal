'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';

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
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWishlist(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const token = localStorage.getItem('auth_token');
    try {
      await fetch(`/api/v1/wishlist/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(prev => prev.filter(item => item.productId !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove from wishlist');
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
    toast.success(`${item.product.name} added to cart`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">My Wishlist</h1>
          <p className="text-neutral-600 mt-1">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-2xl font-bold text-neutral-700 mb-2">Your wishlist is empty</h2>
            <p className="text-neutral-500 mb-6">Save products you love for later</p>
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
                className="bg-white rounded-2xl shadow-soft overflow-hidden group"
              >
                <div className="relative h-48">
                  <Image
                    src={item.product.images?.[0] || '/images/placeholder.svg'}
                    alt={item.product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                  />
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                    title="Remove from wishlist"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-xs text-primary-600 font-medium mb-1">{item.product.category?.name}</p>
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-semibold text-neutral-800 hover:text-primary-600 transition-colors line-clamp-2">{item.product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-2 mb-4">
                    <span className="text-lg font-bold text-primary-700">PKR {item.product.price.toLocaleString()}</span>
                    {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                      <span className="text-sm text-neutral-400 line-through">PKR {item.product.originalPrice.toLocaleString()}</span>
                    )}
                    <span className="text-xs text-neutral-500">/{item.product.unit}</span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.product.isAvailable}
                    className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
