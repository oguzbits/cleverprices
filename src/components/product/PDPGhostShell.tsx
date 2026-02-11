import { cn } from "@/lib/utils";

interface PDPGhostShellProps {
  product: any;
  schemaBreadcrumbs: any[];
}

export function PDPGhostShell({
  product,
  schemaBreadcrumbs,
}: PDPGhostShellProps) {
  return (
    <div className="text-[14px]">
      <div
        className={cn(
          "oopStage",
          "mb-6 grid grid-cols-1 grid-rows-[auto_auto_auto] gap-0 lg:grid-cols-[1fr_2fr_1fr] lg:grid-rows-[auto_auto]",
        )}
      >
        {/* Left Column: Gallery (Pre-rendered static-ish) */}
        <div className="min-w-0 flex-1 px-2.5 sm:px-0 lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:-row-end-1">
          <div className="mx-auto aspect-square w-full max-w-[265px] animate-pulse rounded-lg bg-gray-50" />
        </div>

        {/* Title & Meta */}
        <div className="col-start-1 row-start-1 min-w-0 flex-1 px-2.5 sm:px-[15px] lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:px-[15px]">
          <div className="mb-4 h-8 w-3/4 animate-pulse rounded bg-gray-50" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-50" />
        </div>

        {/* Specs Area */}
        <div className="w-full min-w-0 flex-1 lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:-row-end-1 lg:justify-self-start lg:px-[15px]">
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-gray-50" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-50" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-gray-50" />
          </div>
        </div>

        {/* Price Chart Column (Skeleton) */}
        <div className="hidden px-0 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:-row-end-1 lg:block">
          <div className="h-[250px] w-full animate-pulse rounded bg-gray-50" />
        </div>
      </div>

      <div className="oop-mainWrapper flex w-full flex-wrap">
        <div className="hidden pr-[15px] xl:block xl:w-1/4">
          <div className="h-[300px] w-full animate-pulse rounded bg-gray-50" />
        </div>
        <div className="w-full lg:w-3/4">
          <div className="h-[400px] w-full animate-pulse rounded bg-gray-50" />
        </div>
      </div>
    </div>
  );
}
