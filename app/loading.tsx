export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-5 w-40 bg-elevated rounded animate-pulse" />
          <div className="h-9 w-28 bg-elevated rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar skeleton */}
        <div className="h-10 w-full bg-elevated rounded-lg animate-pulse mb-6" />

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-xl p-5 border-t-2 border-t-elevated"
            >
              <div className="w-14 h-14 rounded-xl bg-elevated animate-pulse mb-4" />
              <div className="h-4 w-24 bg-elevated rounded animate-pulse mb-2" />
              <div className="h-3 w-36 bg-elevated rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
