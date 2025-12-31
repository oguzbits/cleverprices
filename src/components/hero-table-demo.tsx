"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  batteryProducts,
  categories,
  categoryConfig,
  hardDriveProducts,
  powerSupplyProducts,
  type BatteryProduct,
  type HardDriveProduct,
  type PowerSupplyProduct,
} from "@/lib/data/demo-products";
import { cn } from "@/lib/utils";
import { Search, Sparkles, TrendingUp } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

export function HeroTableDemo() {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // React Compiler automatically memoizes these - no need for useMemo
  const currentCategory = categories[currentCategoryIndex];
  const config = categoryConfig[currentCategory];

  // Rotation logic - pauses on hover/focus for accessibility
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setFadeOut(true);
      setTimeout(() => {
        // Use startTransition for non-urgent state updates
        startTransition(() => {
          setCurrentCategoryIndex((prev) => (prev + 1) % categories.length);
        });
        setFadeOut(false);
      }, 300); // Half of transition duration
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered]);

  // React Compiler automatically memoizes this - no need for useMemo
  const products =
    currentCategory === "harddrives"
      ? hardDriveProducts
      : currentCategory === "batteries"
        ? batteryProducts
        : powerSupplyProducts;

  return (
    <div
      className="perspective-1000 relative mx-auto w-full max-w-5xl"
      role="region"
      aria-label="Interactive product comparison demo"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Background Glow */}
      <div
        className="bg-primary/10 absolute top-1/2 left-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        aria-hidden="true"
      />

      <Card className="border-border/40 bg-card/80 ring-border/50 overflow-hidden rounded-3xl shadow-2xl ring-1 backdrop-blur-xl">
        {/* Top Bar (Browser/App Header) */}
        <div className="border-border bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <div className="flex shrink-0 gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#FF5F56]" />
              <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
              <div className="h-3 w-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="bg-border h-4 w-px shrink-0" />
            <div className="text-muted-foreground flex min-w-0 flex-1 items-center gap-2 text-sm">
              <Search className="h-3 w-3 shrink-0" />
              <span className="truncate">{config.url}</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex h-[350px] transition-opacity duration-300 sm:h-[450px]",
            fadeOut && "opacity-50",
          )}
          style={{ willChange: fadeOut ? "opacity" : "auto" }}
        >
          {/* Main Content */}
          <div className="bg-muted/40 flex min-w-0 flex-1 flex-col">
            {/* Page Header */}
            <div className="border-border border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <h2 className="text-foreground text-base font-bold">
                  {config.title}
                </h2>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden">
              <div className="w-full min-w-[600px]">
                {/* Table Header */}
                <div className="border-border text-muted-foreground bg-muted/50 grid grid-cols-12 gap-2 border-b px-4 py-2 text-[11px] font-semibold sm:text-sm">
                  <div className="col-span-3 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {config.unitLabel}
                  </div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">
                    {currentCategory === "harddrives" && "Capacity"}
                    {currentCategory === "batteries" && "Pack"}
                    {currentCategory === "powersupplies" && "Watts"}
                  </div>
                  <div className="col-span-5 sm:col-span-4">Product</div>
                </div>

                {/* Table Body */}
                <div className="divide-border divide-y">
                  {products.map((product: BatteryProduct | HardDriveProduct | PowerSupplyProduct, idx) => (
                    <div
                      key={product.id}
                      className={cn(
                        "grid grid-cols-12 items-center gap-2 px-4 py-3 text-xs transition-all sm:text-sm",
                        idx === 0 &&
                          "bg-primary/5 ring-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent shadow-xs ring-1 ring-inset",
                      )}
                    >
                      <div className="text-foreground col-span-3 flex items-center gap-2 font-mono font-bold">
                        {config.currency}
                        {currentCategory === "harddrives"
                          ? (product as HardDriveProduct).pricePerUnit.toFixed(
                              2,
                            )
                          : currentCategory === "batteries"
                            ? (product as BatteryProduct).pricePerUnit.toFixed(
                                2,
                              )
                            : (
                                product as PowerSupplyProduct
                              ).pricePerUnit.toFixed(2)}
                        {idx === 0 && (
                          <Badge className="h-4 border-0 bg-emerald-100 px-1.5 text-[10px] font-bold tracking-wider text-emerald-800 uppercase sm:text-[11px] dark:bg-emerald-500/20 dark:text-emerald-300">
                            Best
                          </Badge>
                        )}
                      </div>
                      <div className="text-foreground/80 col-span-2 font-mono">
                        {config.currency}
                        {product.price.toFixed(2)}
                      </div>
                      <div className="text-foreground/85 col-span-2 font-mono text-[11px] sm:text-sm">
                        {currentCategory === "harddrives" &&
                          `${(product as HardDriveProduct).capacity}${(product as HardDriveProduct).capacityUnit}`}
                        {currentCategory === "batteries" &&
                          `${(product as BatteryProduct).packSize}p`}
                        {currentCategory === "powersupplies" &&
                          `${(product as PowerSupplyProduct).wattage}W`}
                      </div>
                      <div className="col-span-5 sm:col-span-4">
                        <span className="text-foreground/90 dark:text-white block truncate font-bold">
                          {product.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Integrated Insight Bar - Replaces the obstructive floating box */}
            <div className="border-border bg-primary/3 mt-auto border-t px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm">
                <div className="bg-primary/10 text-primary flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold tracking-wider uppercase">
                  <Sparkles className="h-3 w-3" />
                  <p className="hidden xl:block">Insight</p>
                </div>
                <p className="text-foreground/90 truncate font-medium">
                  {config.insightText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
