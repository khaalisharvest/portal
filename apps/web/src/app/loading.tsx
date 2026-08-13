import ProductLoader from '@/components/ui/ProductLoader';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <ProductLoader size="lg" />
    </div>
  );
}
