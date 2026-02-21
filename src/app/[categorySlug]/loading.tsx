/**
 * Category page loading state.
 *
 * Shows while Next.js fetches/streams the RSC payload for a category page.
 * This provides instant visual feedback on navigation, preventing the App Router
 * from silently holding on the previous page during the server fetch.
 */
export default function CategoryLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] animate-pulse px-4 py-8">
      {/* Page header skeleton */}
      <div className="mb-6 h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />

      {/* Filter + product grid skeleton */}
      <div className="flex gap-6">
        {/* Filter sidebar */}
        <div className="hidden w-56 shrink-0 space-y-4 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 h-32 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
