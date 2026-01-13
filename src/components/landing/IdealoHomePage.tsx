"use client";

import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import { EmptyState } from "@/components/ui/EmptyState";
import { IdealoHero } from "./IdealoHero";
import { IdealoSection } from "./IdealoSection";

interface Product {
  title: string;
  price: number;
  slug: string;
  image?: string;
  badgeText?: string;
}

interface IdealoHomePageProps {
  deals: Product[];
  bestsellers: Product[];
  newArrivals: Product[];
}

export function IdealoHomePage({
  deals,
  bestsellers,
  newArrivals,
}: IdealoHomePageProps) {
  // Handle empty state if all lists are empty
  if (
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
      {/* Hero Section - light blue bg */}
      <IdealoSection variant="lightBlue" className="py-4">
        {/* Pass bestsellers to Hero for now */}
        <IdealoHero products={bestsellers} />
      </IdealoSection>

      {/* Bestseller Carousel - white bg */}
      <IdealoSection variant="white">
        <IdealoProductCarousel title="Bestseller" products={bestsellers} />
      </IdealoSection>

      {/* Top Deals - light blue bg (alternating) */}
      <IdealoSection variant="lightBlue">
        <IdealoProductCarousel
          title="Aktuelle Deals für dich"
          products={deals}
        />
      </IdealoSection>

      {/* New Arrivals - white bg (alternating) */}
      <IdealoSection variant="white">
        <IdealoProductCarousel title="Neuheiten" products={newArrivals} />
      </IdealoSection>
    </div>
  );
}
