export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div
      className={`${s} animate-spin rounded-full border-2 border-slate-600 border-t-blue-500`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm mt-3">Loading...</p>
      </div>
    </div>
  );
}
