import ProductLoader from '@/components/ui/ProductLoader';

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <ProductLoader size="md" />
    </div>
  );
}
