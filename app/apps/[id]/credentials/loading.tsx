export default function CredentialsLoading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <div className="h-4 w-16 bg-elevated rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-elevated rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-elevated rounded animate-pulse" />
            <div className="h-3 w-24 bg-elevated rounded animate-pulse" />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 bg-elevated rounded-full animate-pulse" />
            <div className="h-4 w-40 bg-elevated rounded animate-pulse" />
            <div className="h-3 w-56 bg-elevated rounded animate-pulse" />
            <div className="h-10 w-full bg-elevated rounded-lg animate-pulse mt-4" />
            <div className="h-10 w-full bg-elevated rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
