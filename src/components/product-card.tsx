import { Badge } from "@/components/ui/badge";
import { TrendingDown, Package } from "lucide-react";
import { getCountryByCode } from "@/lib/countries";

export interface ProductCardProps {
  title: string;
  price: number;
  oldPrice?: number;
  currency: string;
  url: string;
  pricePerUnit?: string;
  condition?: string;
  discountPercentage?: number;
  badgeText?: string;
  badgeColor?: "blue" | "green" | "amber";
  countryCode?: string;
}

export function ProductCard({
  title,
  price,
  oldPrice,
  currency,
  url,
  pricePerUnit,
  condition = "New",
  discountPercentage,
  badgeText,
  badgeColor = "blue",
  countryCode = "de",
}: ProductCardProps) {
  const countryConfig = getCountryByCode(countryCode);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(countryConfig?.locale || "de-DE", {
      style: "currency",
      currency: currency || countryConfig?.currency || "EUR",
    }).format(value);
  };

  const getBadgeStyle = () => {
    switch (badgeColor) {
      case "green":
        return "bg-[#46a61a] dark:bg-green-600";
      case "amber":
        return "bg-amber-500";
      case "blue":
      default:
        return "bg-[#0066CC] dark:bg-blue-600";
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col p-3 rounded-xl border border-border/50 bg-card hover:border-[#0066CC]/50 dark:hover:border-blue-400/50 transition-all shadow-sm hover:shadow-md no-underline h-full"
    >
      {/* Discount Badge */}
      {discountPercentage && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg px-2 py-1 text-xs font-bold">
            <TrendingDown className="h-3 w-3 mr-1" />
            -{discountPercentage}%
          </Badge>
        </div>
      )}

      {/* Status/Condition Badge */}
      <div className="absolute top-2 left-2 z-10">
        <Badge
          className={`${getBadgeStyle()} text-white border-0 text-[10px] font-bold py-0 h-5 px-2 rounded-sm uppercase tracking-wide shadow-sm`}
        >
          {badgeText || (condition === "New" ? "Good Deal" : condition)}
        </Badge>
      </div>

      {/* Image Placeholder with Icon */}
      <div className="relative aspect-square bg-muted/20 dark:bg-muted/10 rounded-lg mb-3 overflow-hidden flex items-center justify-center p-4 group-hover:scale-[1.02] transition-transform duration-300">
        <Package className="w-16 h-16 text-muted-foreground/30 stroke-1" />
      </div>

      {/* Title */}
      <h3 className="text-[11px] font-bold text-[#0066CC] dark:text-blue-400 mb-1.5 line-clamp-2 group-hover:underline h-8 leading-tight">
        {title}
      </h3>

      {/* Price Section */}
      <div className="mt-auto">
        <div className="text-center mb-3">
          <span className="text-lg font-black text-foreground block">
            {formatCurrency(price)}
          </span>
          {oldPrice && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Avg: <span className="line-through">{formatCurrency(oldPrice)}</span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="px-2 pb-1">
          <button className="w-full py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-black font-medium text-xs rounded-full shadow-sm border border-[#FCD200] transition-colors cursor-pointer">
            View on Amazon
          </button>
        </div>

        {/* Unit Price */}
        {pricePerUnit && (
          <div className="text-[10px] text-center text-muted-foreground/70 mt-2 font-mono">
            {pricePerUnit}
          </div>
        )}
      </div>
    </a>
  );
}
