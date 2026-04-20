export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-8 w-16 mt-1" />
        <Skeleton className="h-3 w-20 mt-1" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-800/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className={`h-3.5 ${i === 0 ? 'w-32' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

export function TimelineRowSkeleton() {
  return (
    <div className="flex gap-4 py-3">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}
