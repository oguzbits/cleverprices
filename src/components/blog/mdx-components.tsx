import { getCategoryPath, type CategorySlug } from "@/lib/categories";
import {
  DEFAULT_COUNTRY,
  getCountryByCode,
  type CountryCode,
} from "@/lib/countries";
import { Product } from "@/lib/product-registry";
import {
  calculateProductMetrics,
  getLocalizedProductData,
} from "@/lib/utils/products";
import { TrendingDown, Zap } from "lucide-react";
import Link from "next/link";

interface QuickPicksProps {
  category: string;
  products: Product[];
  country: string;
  limit?: number;
}

export function QuickPicks({
  category,
  products,
  country,
  limit = 3,
}: QuickPicksProps) {
  const countryConfig =
    getCountryByCode(country) || getCountryByCode(DEFAULT_COUNTRY);

  const formatter = new Intl.NumberFormat(countryConfig?.locale || "en-US", {
    style: "currency",
    currency: countryConfig?.currency || "USD",
  });

  // Filter and sort products by price per unit (best value) for the CURRENT country
  const picks = products
    .map((p) => {
      const localized = getLocalizedProductData(p, country);
      if (!localized.price) return null;

      const metrics = calculateProductMetrics(p, localized.price) as Product;
      const rawPricePerUnit = metrics.pricePerUnit || 0;

      return {
        asin: p.asin,
        title: p.title,
        price: localized.price,
        displayPrice: formatter.format(localized.price),
        slug: p.slug,
        rawPricePerUnit,
        pricePerUnit: formatter.format(rawPricePerUnit),
        unitType: (metrics.capacityUnit || "unit").toUpperCase(),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.rawPricePerUnit - b.rawPricePerUnit)
    .slice(0, limit);

  if (picks.length === 0) return null;

  return (
    <div className="not-prose border-border/50 my-12 overflow-hidden rounded-3xl border bg-white/50 shadow-xl shadow-zinc-200/50 backdrop-blur-md dark:bg-black/40 dark:shadow-2xl dark:shadow-black">
      <div className="bg-muted/20 dark:bg-muted/10 border-border/50 border-b px-6 py-5">
        <h3 className="flex items-center gap-3 text-lg font-black tracking-tighter uppercase italic">
          <Zap className="text-primary fill-primary h-5 w-5" />
          Live Value Picks:{" "}
          <span className="text-foreground ml-1 not-italic">
            {category.replace("-", " ")}
          </span>
        </h3>
      </div>
      <div className="divide-border/30 divide-y">
        {picks.map((product, idx) => (
          <div
            key={product.asin}
            className="group relative flex flex-col justify-between gap-4 p-6 transition-all duration-300 hover:bg-zinc-500/5 sm:flex-row sm:items-center dark:hover:bg-white/5"
          >
            <div className="flex flex-1 items-start gap-4">
              <div className="bg-muted/30 dark:bg-muted/20 text-muted-foreground border-border/50 group-hover:border-primary/30 group-hover:text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-black transition-colors">
                #{idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-foreground group-hover:text-foreground/90 text-lg leading-snug font-bold transition-colors">
                  <a
                    href={`/out/${product.slug}?country=${country}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline"
                  >
                    {product.title}
                  </a>
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-primary font-bold tabular-nums">
                    {product.displayPrice}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <TrendingDown className="text-primary/70 h-3.5 w-3.5" />
                    <span className="text-foreground font-bold tabular-nums">
                      {product.pricePerUnit}
                    </span>{" "}
                    / {product.unitType}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <a
                href={`/out/${product.slug}?country=${country}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-[#FCD200]/50 bg-[#FFD814] px-3 text-[11px] font-bold whitespace-nowrap text-black no-underline shadow-sm transition-all hover:bg-[#F7CA00] hover:no-underline active:scale-[0.98] sm:h-9 sm:rounded-xl sm:px-4 sm:text-sm"
              >
                View on Amazon
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-muted/10 dark:bg-muted/5 border-border/30 border-t px-6 py-4 text-center">
        <Link
          href={getCategoryPath(
            category as CategorySlug,
            country as CountryCode,
          )}
          className="text-muted-foreground hover:text-primary group flex items-center justify-center gap-2 text-xs font-black tracking-[0.2em] uppercase transition-all"
          prefetch={true}
        >
          View all {category.replace("-", " ")} deals
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}

export function LocalizedLink({
  href,
  children,
  country,
}: {
  href: string;
  children: React.ReactNode;
  country: string;
}) {
  const isInternal = href.startsWith("/");
  const finalHref =
    isInternal && country !== "us" ? `/${country}${href}` : href;

  return (
    <Link
      href={finalHref}
      className="text-primary font-bold no-underline transition-colors hover:underline"
    >
      {children}
    </Link>
  );
}
