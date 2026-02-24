import {
  IdealoProductCarousel,
  type CarouselProduct,
} from "@/components/IdealoProductCarousel";
import type { LivePriceData } from "@/components/landing/IdealoProductCard";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { LazySection } from "@/components/ui/LazySection";
import type { CountryCode } from "@/lib/countries";
import type { Category } from "@/types";
import { IdealoHero } from "./IdealoHero";
import { IdealoSection } from "./IdealoSection";

interface IdealoHomePageProps {
  heroProducts: CarouselProduct[];
  bestsellers: CarouselProduct[];
  deals: CarouselProduct[];
  newArrivals: CarouselProduct[];
  categories: Category[];
  countryCode: string;
  livePriceMap?: Map<number, LivePriceData>;
}

export function IdealoHomePage({
  heroProducts,
  bestsellers,
  deals,
  newArrivals,
  countryCode,
  livePriceMap,
}: IdealoHomePageProps) {
  // Handle empty state - only show if we are NOT in a suspected query-failure state
  const hasContent =
    heroProducts.length > 0 ||
    deals.length > 0 ||
    bestsellers.length > 0 ||
    newArrivals.length > 0;

  if (!hasContent) {
    return (
      <div className="flex min-h-[600px] items-center justify-center bg-[#f5f5f5]">
        <div className="p-12 text-center">
          {/* Minimal placeholder to avoid "Willkommen" flicker if data is just slow */}
          <div className="animate-pulse text-gray-400">
            Inhalte werden geladen...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f5]">
      <CategoryNav country={countryCode} />
      {/* Hero Section - light blue bg - Critical, so we keep regular import or direct usage */}
      {heroProducts.length > 0 ? (
        <IdealoSection variant="lightBlue">
          <IdealoHero products={heroProducts} livePriceMap={livePriceMap} />
        </IdealoSection>
      ) : null}

      {/* Bestseller Carousel - Just below hero, likely visible or near-visible */}
      {bestsellers.length > 0 ? (
        <LazySection
          placeholderHeight="400px"
          rootMargin="300px"
          immediate={true}
        >
          <IdealoSection variant="white">
            <IdealoProductCarousel
              title="Bestseller"
              products={bestsellers}
              livePriceMap={livePriceMap}
              countryCode={countryCode as CountryCode}
            />
          </IdealoSection>
        </LazySection>
      ) : null}

      {/* Top Deals - Below the fold */}
      {deals.length > 0 ? (
        <LazySection placeholderHeight="400px" rootMargin="300px">
          <IdealoSection variant="lightBlue">
            <IdealoProductCarousel
              title="Aktuelle Deals für dich"
              products={deals}
              livePriceMap={livePriceMap}
              countryCode={countryCode as CountryCode}
            />
          </IdealoSection>
        </LazySection>
      ) : null}

      {/* New Arrivals - Below the fold */}
      {newArrivals.length > 0 ? (
        <LazySection placeholderHeight="400px" rootMargin="300px">
          <IdealoSection variant="white">
            <IdealoProductCarousel
              title="Neuheiten"
              products={newArrivals}
              livePriceMap={livePriceMap}
              countryCode={countryCode as CountryCode}
            />
          </IdealoSection>
        </LazySection>
      ) : null}
    </div>
  );
}
