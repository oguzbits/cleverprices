import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import { PrefetchLink } from "@/components/ui/PrefetchLink";

interface Product {
  title: string;
  price: number;
  slug: string;
  image?: string;
  badgeText?: string;
}

interface IdealoHeroProps {
  products: Product[];
}

export function IdealoHero({ products }: IdealoHeroProps) {
  // Show first 8 products in hero carousel
  const heroProducts = products.slice(0, 8);

  return (
    <div className="flex gap-4">
      {/* Left side - Featured products carousel (only if products exist) */}
      {heroProducts.length > 0 ? (
        <div className="min-w-0 flex-1 overflow-hidden rounded-[6px]">
          <IdealoProductCarousel
            title="Beliebte Produkte"
            products={heroProducts}
            priorityImages
          />
        </div>
      ) : (
        <div className="bg-card flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[6px] p-8">
          <div className="text-muted-foreground text-center">
            <p className="text-lg font-semibold">Produkte werden geladen...</p>
            <p className="text-sm">Entdecken Sie bald unsere besten Angebote</p>
          </div>
        </div>
      )}

      {/* Right side - Promo banner */}
      <div className="from-idealo-blue to-idealo-blue-hover hidden w-[280px] shrink-0 overflow-hidden rounded-[6px] bg-linear-to-br lg:block">
        <div className="flex h-full flex-col items-center justify-center p-6 text-center text-white">
          <div className="mb-3 text-sm font-bold tracking-wide uppercase opacity-80">
            Top Angebote
          </div>
          <div className="mb-4 text-2xl font-black">Jetzt sparen!</div>
          <p className="mb-6 text-sm opacity-70">
            Die besten Deals für Technik &amp; Hardware
          </p>
          <PrefetchLink
            href="/deals"
            className="text-idealo-blue focus-visible:ring-offset-idealo-blue rounded bg-white px-5 py-2 text-sm font-bold no-underline transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            Zu den Deals
          </PrefetchLink>
        </div>
      </div>
    </div>
  );
}
