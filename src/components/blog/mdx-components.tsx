import { getCategoryPath, type CategorySlug } from "@/lib/categories";
import { DEFAULT_COUNTRY, getCountryByCode, type CountryCode } from "@/lib/countries";
import { Product } from "@/lib/product-registry";
import { calculateProductMetrics, getLocalizedProductData } from "@/lib/utils/products";
import { TrendingDown, Zap } from "lucide-react";
import Link from "next/link";

interface QuickPicksProps {
  category: string;
  products: Product[];
  country: string;
  limit?: number;
}

export function QuickPicks({ category, products, country, limit = 3 }: QuickPicksProps) {
  const countryConfig = getCountryByCode(country) || getCountryByCode(DEFAULT_COUNTRY);

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
    <div className="not-prose my-12 overflow-hidden rounded-3xl border border-border/50 bg-white/50 dark:bg-black/40 backdrop-blur-md shadow-xl dark:shadow-2xl shadow-zinc-200/50 dark:shadow-black">
      <div className="bg-muted/20 dark:bg-muted/10 border-b border-border/50 px-6 py-5">
        <h3 className="flex items-center gap-3 text-lg font-black tracking-tighter uppercase italic">
          <Zap className="h-5 w-5 text-primary fill-primary" />
          Live Value Picks: <span className="text-foreground not-italic ml-1">{category.replace("-", " ")}</span>
        </h3>
      </div>
      <div className="divide-y divide-border/30">
        {picks.map((product, idx) => (
          <div key={product.asin} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 transition-all duration-300 hover:bg-zinc-500/5 dark:hover:bg-white/5">
            <div className="flex flex-1 items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/30 dark:bg-muted/20 text-sm font-black text-muted-foreground border border-border/50 transition-colors group-hover:border-primary/30 group-hover:text-foreground">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg leading-snug text-foreground transition-colors group-hover:text-foreground/90">
                  <a href={`/out/${product.slug}?country=${country}`} target="_blank" rel="noopener noreferrer" className="no-underline">
                    {product.title}
                  </a>
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-bold text-primary tabular-nums">
                    {product.displayPrice}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <TrendingDown className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-foreground font-bold tabular-nums">{product.pricePerUnit}</span> / {product.unitType}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 self-end sm:self-center">

              
              <a 
                href={`/out/${product.slug}?country=${country}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-[#FCD200]/50 bg-[#FFD814] px-3 text-[11px] font-bold whitespace-nowrap text-black shadow-sm transition-all hover:bg-[#F7CA00] active:scale-[0.98] sm:h-9 sm:rounded-xl sm:px-4 sm:text-sm no-underline hover:no-underline"
              >
                View on Amazon
              </a>
            </div>


          </div>
        ))}
      </div>
      <div className="bg-muted/10 dark:bg-muted/5 px-6 py-4 text-center border-t border-border/30">
        <Link 
          href={getCategoryPath(category as CategorySlug, country as CountryCode)}
          className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 group"
        >
          View all {category.replace("-", " ")} deals
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </div>
  );
}

export function LocalizedLink({ href, children, country }: { href: string; children: React.ReactNode; country: string }) {
  const isInternal = href.startsWith("/");
  const finalHref = isInternal && country !== "us" ? `/${country}${href}` : href;

  return (
    <Link href={finalHref} className="text-primary no-underline hover:underline font-bold transition-colors">
      {children}
    </Link>
  );
}
