export default function NewAppLoading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <div className="h-4 w-16 bg-elevated rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-6 w-32 bg-elevated rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-20 bg-elevated rounded animate-pulse" />
            <div className="h-10 w-full bg-elevated rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
