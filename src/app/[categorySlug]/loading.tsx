export default function CategoryLoading() {
  return (
    <div className="sr-searchResult bg-secondary min-h-screen">
      <div className="mx-auto max-w-[1280px]">
        {/* Skeleton Top Section */}
        <div className="border-border bg-card border-b px-4">
          {/* Breadcrumb Skeleton */}
          <div className="py-3">
            <div className="bg-muted h-4 w-48 animate-pulse rounded" />
          </div>
          {/* Top Bar Skeleton */}
          <div className="flex items-center justify-between border-t py-4">
            <div className="bg-muted h-8 w-64 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-muted h-8 w-24 animate-pulse rounded" />
              <div className="bg-muted h-8 w-24 animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* Skeleton Products Area */}
        <div className="relative mt-3 mb-[45px] flex flex-row flex-wrap">
          {/* Sidebar Skeleton (Idealo Breakpoints: >= 840px 33%, >= 960px 25%) */}
          <div className="hidden px-4 min-[840px]:block min-[840px]:w-1/3 min-[960px]:w-1/4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mb-6">
                <div className="bg-muted mb-3 h-5 w-32 animate-pulse rounded" />
                <div className="space-y-2">
                  <div className="bg-muted/60 h-4 w-full animate-pulse rounded" />
                  <div className="bg-muted/60 h-4 w-4/5 animate-pulse rounded" />
                  <div className="bg-muted/60 h-4 w-3/4 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Product Grid Skeleton */}
          <div className="w-full overflow-hidden px-4 min-[840px]:w-2/3 min-[960px]:w-3/4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card flex h-[380px] flex-col rounded p-4 shadow-sm"
                >
                  <div className="bg-muted mb-4 h-40 w-full animate-pulse rounded" />
                  <div className="bg-muted mb-2 h-5 w-full animate-pulse rounded" />
                  <div className="bg-muted mb-4 h-5 w-2/3 animate-pulse rounded" />
                  <div className="mt-auto flex justify-between">
                    <div className="bg-muted h-6 w-16 animate-pulse rounded" />
                    <div className="bg-primary/10 h-8 w-20 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
