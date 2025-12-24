import { Badge } from "@/components/ui/badge";
import { getCountryByCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import Image from "next/image";

export interface ProductCardProps {
  title: string;
  price: number;
  currency: string;
  url: string;
  pricePerUnit?: string;
  badgeText?: string;
  badgeColor?: "blue" | "green" | "amber";
  countryCode?: string;
  image?: string;
  className?: string;
  priority?: boolean;
}

export function ProductCard({
  title,
  price,
  currency,
  url,
  pricePerUnit,
  badgeText,
  badgeColor = "blue",
  countryCode = "de",
  image,
  className,
  priority = false,
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
        "group border-border/60 bg-card relative flex h-full w-[220px] shrink-0 flex-col rounded-2xl border p-4 no-underline shadow-sm transition-shadow hover:shadow-md sm:w-[265px] md:w-[293px] lg:w-[238px] xl:w-[242px] 2xl:w-[293px]",
        className,
      )}
    >
      <div className="absolute top-2.5 left-2.5 z-10">
        {badgeText &&
          (badgeText === "Best Price" || badgeText === "Good Deal") && (
            <Badge
              className={`${getBadgeStyle()} rounded-2xl border text-base font-bold tracking-tight capitalize shadow-sm`}
            >
              {badgeText}
            </Badge>
          )}
      </div>

      {/* Image Container */}
      <div className="bg-muted/20 dark:bg-muted/10 relative mb-3 flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl p-3">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain p-4"
            sizes="(max-width: 640px) 220px, (max-width: 768px) 265px, (max-width: 1024px) 293px, 300px"
            quality={50}
            priority={priority}
          />
        ) : (
          <Package className="text-muted-foreground/10 h-10 w-10 stroke-1" />
        )}
      </div>

      {/* Title */}
      <div className="mb-3 h-10 overflow-hidden">
        <h3 className="text-foreground line-clamp-2 text-base leading-tight">
          {title}
        </h3>
      </div>

      {/* Price Section */}
      <div className="mt-auto space-y-3">
        <div className="flex flex-col gap-2">
          <span className="text-foreground text-xl leading-none font-bold tracking-tight">
            {formatCurrency(price)}
          </span>

          {pricePerUnit && (
            <div className="border-border/40 flex items-center justify-between border-t pt-1">
              <span className="text-muted-foreground/40 text-sm font-black tracking-widest uppercase">
                Unit Price
              </span>
              <span className="text-primary bg-primary/5 rounded-md px-1.5 py-0.5 font-mono text-base font-bold">
                {pricePerUnit}
              </span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="relative pt-0.5">
          <button className="relative w-full cursor-pointer overflow-hidden rounded-2xl border border-[#FCD200]/50 bg-[#FFD814] py-1.5 text-base font-bold text-black shadow-sm transition-all hover:bg-[#F7CA00] active:scale-[0.98]">
            <span className="relative z-10">View on Amazon</span>
          </button>
        </div>
      </div>
    </a>
  );
}
