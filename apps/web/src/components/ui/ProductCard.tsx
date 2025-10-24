'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HeartIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

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
  isFresh?: boolean;
  isOrganic?: boolean;
  quality?: string;
  variety?: string;
  specifications?: {
    quality: string;
    variety: string;
    season: string;
    origin: string;
  };
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg cursor-pointer w-full">
      <div className="relative mb-2">
        <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
          <Image
            src={product.images?.[0] || product.image || '/images/placeholder.svg'}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-32 sm:h-36 md:h-40 object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
        
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          {isFavorited ? (
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {product.isFresh && (
          <span className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            Fresh
          </span>
        )}

        {product.isOrganic && (
          <span className="absolute bottom-2 left-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            Organic
          </span>
        )}

        {(product.quality || product.specifications?.quality) && (
          <span className="absolute top-2 right-12 bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
            {product.quality || product.specifications?.quality}
          </span>
        )}
      </div>

      <div className="space-y-1 px-2 py-2">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">
          {product.name}
          {(product.variety || product.specifications?.variety) && (
            <span className="block text-xs sm:text-sm text-gray-600 font-normal">
              {product.variety || product.specifications?.variety}
            </span>
          )}
        </h3>

        <div className="flex items-center space-x-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-gray-600">
            {product.rating || 0} ({product.reviewCount || 0})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-base sm:text-lg font-bold text-gray-900">
              ₨{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs sm:text-sm text-gray-500 line-through">
                ₨{product.originalPrice}
              </span>
            )}
            {product.unit && (
              <span className="text-xs sm:text-sm text-gray-600">/{product.unit}</span>
            )}
          </div>
        </div>

        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-1.5 px-2 rounded-lg transition-colors duration-200 mt-1 text-xs">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
