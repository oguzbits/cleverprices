"use client";

import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import { EmptyState } from "@/components/ui/EmptyState";
import { IdealoHero } from "./IdealoHero";
import { IdealoSection } from "./IdealoSection";
import { allCategories, stripCategoryIcon } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";
import { CategoryCard } from "@/components/ui/category-card";

interface Product {
  title: string;
  price: number;
  slug: string;
  image?: string;
  badgeText?: string;
}

interface IdealoHomePageProps {
  products: Product[];
}

export function IdealoHomePage({ products }: IdealoHomePageProps) {
  // Handle empty products state
  if (products.length === 0) {
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

  // Split products for different sections
  const bestsellers = products.slice(0, 8);
  const recommendations = products.slice(4, 12);
  const deals = products
    .slice(0, 6)
    .map((p) => ({ ...p, badgeText: "Top Deal" }));

  return (
    <div className="bg-[#f5f5f5]">
      {/* Hero Section - light blue bg */}
      <IdealoSection variant="lightBlue" className="py-4">
        <IdealoHero products={products} />
      </IdealoSection>

      {/* Popular Categories Grid */}
      <IdealoSection variant="white" className="py-8">
        <h2 className="mb-6 text-xl font-bold text-[#2d2d2d]">
          Beliebte Kategorien
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(allCategories)
            .filter((c) => !c.parent && !c.hidden)
            .map((cat) => (
              <CategoryCard
                key={cat.slug}
                category={stripCategoryIcon(cat)}
                Icon={getCategoryIcon(cat.slug)}
                country="de"
              />
            ))}
        </div>
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

      {/* Recommendations - white bg (alternating) */}
      <IdealoSection variant="white">
        <IdealoProductCarousel
          title="Unsere Empfehlungen"
          products={recommendations}
        />
      </IdealoSection>
    </div>
  );
}
