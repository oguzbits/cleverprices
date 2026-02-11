import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import Image from "next/image";

interface PDPGhostShellProps {
  product: any;
  schemaBreadcrumbs: any[];
}

export function PDPGhostShell({
  product,
  schemaBreadcrumbs,
}: PDPGhostShellProps) {
  const identity = {
    fullModel: product.title,
    modelTitle: product.title,
    variantSuffix: "",
  };

  return (
    <div className="text-[14px]">
      <div
        className={cn(
          "oopStage",
          "mb-6 grid grid-cols-1 grid-rows-[auto_auto_auto] gap-0 lg:grid-cols-[1fr_2fr_1fr] lg:grid-rows-[auto_auto]",
        )}
      >
        {/* Left Column: Gallery */}
        <div className="min-w-0 flex-1 px-2.5 sm:px-0 lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:-row-end-1">
          <div className="oopStage-gallery">
            <div className="bg-card relative mx-auto flex aspect-square w-full max-w-[265px] items-center justify-center overflow-hidden rounded-lg">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain p-2 opacity-50 transition-opacity duration-300"
                  sizes="(max-width: 265px) calc(100vw - 80px), 265px"
                  priority
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex h-full items-center justify-center">
                  <Package className="h-24 w-24 stroke-1" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title & Meta */}
        <div className="col-start-1 row-start-1 min-w-0 flex-1 px-2.5 sm:px-[15px] lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:px-[15px]">
          <h1 className="text-idealo-text-primary mb-1 line-clamp-2 min-h-[50px] text-[20px] leading-tight font-bold sm:text-center lg:text-left">
            {product.title}
          </h1>
          <div className="mb-4 flex flex-wrap items-center gap-4 sm:justify-center lg:justify-start">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-32 animate-pulse rounded-full bg-blue-50" />
          </div>
        </div>

        {/* Specs Area */}
        <div className="w-full min-w-0 flex-1 lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:-row-end-1 lg:justify-self-start lg:px-[15px]">
          <div className="border-t border-[#dcdcdc] pt-4 lg:border-t-0 lg:pt-0">
            <div className="flex flex-wrap items-baseline gap-1.5 sm:justify-center lg:justify-start">
              <b className="text-[13px] font-bold text-[#2d2d2d]">
                Produktübersicht:
              </b>
              <div className="h-4 w-48 animate-pulse rounded bg-gray-50" />
            </div>
            <div className="mt-4 flex gap-2.5 sm:justify-center lg:justify-start">
              <div className="h-[44px] w-24 animate-pulse rounded bg-gray-50" />
              <div className="h-[44px] w-24 animate-pulse rounded bg-gray-50" />
            </div>
          </div>
        </div>

        {/* Price Chart Column */}
        <div className="hidden px-0 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:-row-end-1 lg:block">
          <div className="h-[250px] w-full animate-pulse rounded border border-gray-100 bg-gray-50/30" />
        </div>
      </div>

      <div className="oop-mainWrapper flex w-full flex-wrap">
        <aside className="order-1 mb-[45px] hidden xl:block xl:w-1/4 xl:pr-[15px]">
          <div className="h-[300px] w-full animate-pulse rounded bg-gray-50/50" />
        </aside>
        <div className="w-full lg:w-3/4">
          <div className="min-h-[400px] w-full animate-pulse rounded bg-gray-50/30" />
        </div>
      </div>
    </div>
  );
}
