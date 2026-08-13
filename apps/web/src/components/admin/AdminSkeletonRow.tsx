export function AdminSkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function AdminSkeletonCard() {
  return (
    <div className="animate-pulse bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-neutral-200 rounded w-1/2" />
          <div className="h-3 bg-neutral-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-neutral-100 rounded w-full" />
      <div className="h-3 bg-neutral-100 rounded w-2/3" />
    </div>
  );
}
