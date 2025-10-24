'use client';

import ResponsiveBackgroundImage from '@/components/ui/ResponsiveBackgroundImage';
import ProductsSection from '@/components/sections/ProductsSection';

export default function ProductsPage() {
  return (
    <div className="min-h-screen">
      <ResponsiveBackgroundImage
        src="/images/products-section.png"
        alt="Fresh organic products background"
        overlayType="products"
        quality={80}
        objectPosition="center"
        fitContent={false}
        minHeight="min-h-screen"
        className="py-8"
      >
        <div className="container-custom">
          {/* Products Section with Pagination */}
          <ProductsSection showPagination={true} />
        </div>
      </ResponsiveBackgroundImage>
    </div>
  );
}
