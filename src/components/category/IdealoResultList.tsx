/**
 * Idealo Result List Component
 *
 * Wrapper for product grid/list that matches Idealo's exact HTML structure.
 */
import { type CountryCode } from "@/lib/countries";
import { type LeanProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

import { IdealoGridCard } from "./IdealoGridCard";
import { IdealoListCard } from "./IdealoListCard";

interface IdealoResultListProps {
  products: LeanProduct[];
  countryCode: CountryCode;
  viewMode: "grid" | "list";
  className?: string;
}

export function IdealoResultList({
  products,
  countryCode,
  viewMode,
  className,
}: IdealoResultListProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded border border-[#b4b4b4] bg-white py-12 text-center">
        <p className="text-[14px] text-[#767676]">
          Keine Produkte gefunden. Bitte passe deine Filter an.
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "sr-resultList sr-resultList--LIST",
          "flex w-full flex-col",
          className,
        )}
      >
        {products.map((product, index) => (
          <IdealoListCard
            key={product.id || product.slug}
            product={product}
            countryCode={countryCode}
            priority={index < 8}
          />
        ))}
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      className={cn(
        "sr-resultList resultList--GRID",
        "grid w-full",
        // Responsive grid columns matching Idealo
        "grid-cols-2",
        "min-[640px]:grid-cols-3",
        "min-[1024px]:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <IdealoGridCard
          key={product.id || product.slug}
          product={product}
          countryCode={countryCode}
          priority={index < 8}
        />
      ))}
    </div>
  );
}
