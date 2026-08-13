'use client';

import ProductsSection from '@/components/sections/ProductsSection';
import OrganicPattern from '@/components/ui/OrganicPattern';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 relative">
      <OrganicPattern />
      <div className="relative container-custom pb-8">
        <ProductsSection showPagination={true} />
      </div>
    </div>
  );
}
