"use client";

import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import { EmptyState } from "@/components/ui/EmptyState";
import dynamic from "next/dynamic";
import { IdealoHero } from "./IdealoHero";
import { IdealoSection } from "./IdealoSection";

// Only dynamic import below-the-fold carousels (Vercel Best Practices: bundle-dynamic-imports)
const DynamicProductCarousel = dynamic(
  () =>
    import("@/components/IdealoProductCarousel").then(
      (mod) => mod.IdealoProductCarousel,
    ),
  {
    loading: () => (
      <div className="h-[400px] w-full animate-pulse rounded-md bg-gray-100" />
    ),
    ssr: true, // Keep SSR for SEO and initial HTML
  },
);

interface Product {
  title: string;
  price: number;
  slug: string;
  image?: string;
  badgeText?: string;
}

interface IdealoHomePageProps {
  popular: Product[];
  deals: Product[];
  bestsellers: Product[];
  newArrivals: Product[];
}

export function IdealoHomePage({
  popular,
  deals,
  bestsellers,
  newArrivals,
}: IdealoHomePageProps) {
  // Handle empty state if all lists are empty
  if (
    popular.length === 0 &&
    deals.length === 0 &&
    bestsellers.length === 0 &&
    newArrivals.length === 0
  ) {
    return (
      <div className="bg-[#f5f5f5]">
        <IdealoSection variant="white" className="py-12">
          <EmptyState
            title="Willkommen bei cleverprices!"
            description="Wir bauen gerade unseren Produktkatalog auf. Schauen Sie sich in der Zwischenzeit unsere Kategorien an."
            action={{
              label: "Kategorien entdecken",
              href: "/categories",
            }}
          />
        </IdealoSection>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f5]">
      {/* Hero Section - light blue bg - Critical, so we keep regular import or direct usage */}
      {popular.length > 0 ? (
        <IdealoSection variant="lightBlue" className="py-4">
          <IdealoHero products={popular} />
        </IdealoSection>
      ) : null}

      {/* Bestseller Carousel - Below hero, can be dynamic or static depending on fold */}
      {bestsellers.length > 0 ? (
        <IdealoSection variant="white">
          <IdealoProductCarousel title="Bestseller" products={bestsellers} />
        </IdealoSection>
      ) : null}

      {/* Top Deals - Below the fold (Vercel Best Practices: bundle-dynamic-imports) */}
      {deals.length > 0 ? (
        <IdealoSection variant="lightBlue">
          <DynamicProductCarousel
            title="Aktuelle Deals für dich"
            products={deals}
          />
        </IdealoSection>
      ) : null}

      {/* New Arrivals - Below the fold */}
      {newArrivals.length > 0 ? (
        <IdealoSection variant="white">
          <DynamicProductCarousel title="Neuheiten" products={newArrivals} />
        </IdealoSection>
      ) : null}
    </div>
  );
}
