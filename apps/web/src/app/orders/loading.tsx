import ProductLoader from '@/components/ui/ProductLoader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <ProductLoader size="lg" />
    </div>
  );
}
