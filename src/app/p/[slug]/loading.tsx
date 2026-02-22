export default function ProductLoading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-[1280px] px-4">
        {/* Breadcrumbs Skeleton */}
        <div className="mb-[10px] py-0 pt-3">
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </div>

        <div className="text-[14px]">
          <div className="mb-6 grid grid-cols-1 grid-rows-[auto_auto_auto] gap-0 lg:grid-cols-[1fr_2fr_1fr] lg:grid-rows-[auto_auto]">
            {/* Gallery Skeleton */}
            <div className="min-w-0 flex-1 px-2.5 sm:px-0 lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:-row-end-1">
              <div className="bg-card relative mx-auto flex aspect-square w-full max-w-[265px] items-center justify-center overflow-hidden rounded-lg">
                <div className="bg-muted h-full w-full animate-pulse" />
              </div>
              <div className="mt-4 lg:hidden">
                <div className="bg-muted h-10 w-full animate-pulse rounded" />
              </div>
            </div>

            {/* Title & Info Skeleton */}
            <div className="col-start-1 row-start-1 min-w-0 flex-1 px-2.5 sm:px-[15px] lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:px-[15px]">
              <div className="bg-muted mb-4 h-8 w-3/4 animate-pulse rounded" />
              <div className="bg-muted mb-6 h-4 w-32 animate-pulse rounded" />
            </div>

            {/* Product Overview Skeleton */}
            <div className="w-full min-w-0 flex-1 lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:-row-end-1 lg:justify-self-start lg:px-[15px]">
              <div className="border-t border-[#dcdcdc] pt-4 lg:border-t-0 lg:pt-0">
                <div className="bg-muted mb-2 h-4 w-full animate-pulse rounded" />
                <div className="bg-muted mb-6 h-4 w-5/6 animate-pulse rounded" />

                <div className="bg-muted mb-6 h-20 w-full animate-pulse rounded" />

                <div className="flex gap-2">
                  <div className="bg-muted h-8 w-24 animate-pulse rounded" />
                  <div className="bg-muted h-8 w-24 animate-pulse rounded" />
                </div>
              </div>
            </div>

            {/* Price Chart Skeleton (Desktop) */}
            <div className="hidden px-0 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:-row-end-1 lg:block">
              <div className="bg-muted h-64 w-full animate-pulse rounded" />
            </div>
          </div>

          <div className="flex w-full flex-wrap">
            {/* Sidebar Skeleton */}
            <aside className="order-1 mb-[45px] hidden xl:block xl:w-1/4 xl:pr-[15px]">
              <div className="bg-muted h-96 w-full animate-pulse rounded" />
            </aside>

            {/* Offers List Skeleton */}
            <div className="order-2 mb-11 w-full min-w-0 xl:w-3/4 xl:pl-[15px]">
              <div className="bg-muted h-10 animate-pulse rounded-t-md border border-[#b4b4b4]" />
              <div className="bg-card h-64 rounded-b-md border border-t-0 border-[#b4b4b4]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
