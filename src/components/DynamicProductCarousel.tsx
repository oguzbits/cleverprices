import dynamic from "next/dynamic";

// Shared dynamic carousel to avoid double bundling across sections and components
export const IdealoProductCarousel = dynamic(
  () =>
    import("@/components/IdealoProductCarousel").then(
      (mod) => mod.IdealoProductCarousel,
    ),
  {
    loading: () => (
      <div className="bg-white px-4 py-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[320px] w-[220px] shrink-0 animate-pulse rounded bg-gray-100"
              />
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: true,
  },
);
