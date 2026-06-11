export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      </div>
    </div>
  );
}
