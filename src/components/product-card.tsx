import { Badge } from "@/components/ui/badge";
import { getCountryByCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import Image from "next/image";

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
  image?: string;
  className?: string;
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
  image,
  className,
}: ProductCardProps) {
  const countryConfig = getCountryByCode(countryCode);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(countryConfig?.locale || "de-DE", {
      style: "currency",
      currency: currency || countryConfig?.currency || "EUR",
    }).format(value);
  };

  const getBadgeStyle = () => {
    // Map specific badge text to colors if needed
    if (badgeText === "Best Price") {
      // CCC: Dark Green text (#1f5200) on Light Green bg (#95ff54)
      return "bg-[#95ff54] text-[#1f5200] border-[#1f5200]/20 shadow-sm";
    }
    if (badgeText === "Good Deal") {
      // CCC: Light Green text (#95ff54) on Dark Green bg (#1f5200)
      return "bg-[#1f5200] text-[#95ff54] border-[#95ff54]/20 shadow-inner";
    }

    switch (badgeColor) {
      case "amber":
        return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-transparent";
      case "blue":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-transparent";
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex flex-col p-4 rounded-2xl border border-border/60 bg-card no-underline w-[220px] sm:w-[265px] md:w-[293px] lg:w-[238px] xl:w-[242px] 2xl:w-[293px] shrink-0 h-full shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="absolute top-2.5 left-2.5 z-10">
        {badgeText && (badgeText === "Best Price" || badgeText === "Good Deal") && (
          <Badge
            className={`${getBadgeStyle()} border text-base font-bold rounded-2xl capitalize shadow-sm tracking-tight`}
          >
            {badgeText}
          </Badge>
        )}
      </div>

      {/* Image Container */}
      <div className="relative aspect-4/3 bg-muted/20 dark:bg-muted/10 rounded-xl mb-3 overflow-hidden flex items-center justify-center p-3">
        {image ? (
          <Image 
            src={image} 
            alt={title}
            fill
            className="object-contain p-4"
            sizes="(max-width: 640px) 220px, (max-width: 768px) 265px, (max-width: 1024px) 293px, 300px"
            quality={50}
          />
        ) : (
          <Package className="w-10 h-10 text-muted-foreground/10 stroke-1" />
        )}
      </div>

      {/* Title */}
      <div className="h-10 mb-3 overflow-hidden">
        <h3 className="text-base text-foreground leading-tight line-clamp-2">
          {title}
        </h3>
      </div>

      {/* Price Section */}
      <div className="mt-auto space-y-3">
        <div className="flex flex-col gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground leading-none">
            {formatCurrency(price)}
          </span>
          
          {pricePerUnit && (
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <span className="text-sm uppercase font-black text-muted-foreground/40 tracking-widest">Unit Price</span>
              <span className="text-base font-mono font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/5">
                {pricePerUnit}
              </span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="relative pt-0.5">
          <button className="relative w-full py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-black font-bold text-base rounded-2xl shadow-sm border border-[#FCD200]/50 transition-all cursor-pointer overflow-hidden active:scale-[0.98]">
            <span className="relative z-10">View on Amazon</span>
          </button>
        </div>
      </div>
    </a>
  );
}
