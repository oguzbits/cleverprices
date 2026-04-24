import { allCategories, Category, type CategorySlug } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryHubCard } from "@/components/category/CategoryHubCard";
import { ProductBestsellerGrid } from "@/components/category/ProductBestsellerGrid";
import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import { BreadcrumbSchema } from "@/components/seo/ProductSchema";
import { LazySection } from "@/components/ui/LazySection";
import { type LeanProduct } from "@/lib/types";
import { formatTechText } from "@/lib/utils/formatting";
import { isProductBestseller } from "@/lib/utils/products";

interface ParentCategoryViewProps {
  parentCategory: Omit<Category, "icon">;
  childCategories: (Omit<Category, "icon"> & {
    popularFilters?: { label: string; params?: string; href?: string }[];
  })[];
  /** Bestseller products for the grid section */
  bestsellers?: LeanProduct[];
  /** New products for the carousel section */
  newProducts?: LeanProduct[];
  deals?: LeanProduct[];
  breadcrumbItems?: { name: string; href?: string }[];
}

export function ParentCategoryView({
  parentCategory,
  childCategories,
  bestsellers = [],
  newProducts = [],
  deals = [],
  breadcrumbItems = [],
}: ParentCategoryViewProps) {
  return (
    <div className="min-h-screen bg-white">
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="mx-auto max-w-[1280px] px-4 py-3">
        <Breadcrumbs items={breadcrumbItems} />
        {/* Subcategory Hub Cards Grid */}
        <section className="mb-20">
          <h2 className="mb-10 text-[28px] font-bold text-[#2d2d2d]">
            {formatTechText(parentCategory.name)}
          </h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
            {childCategories.map((category) => (
              <div key={category.slug}>
                <CategoryHubCard
                  category={category}
                  Icon={getCategoryIcon(category.slug)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Bestseller Section - Lazy loaded since it's below the fold */}
        {bestsellers.length > 0 && (
          <LazySection placeholderHeight="600px" rootMargin="300px">
            <ProductBestsellerGrid
              title={`Bestseller in "${formatTechText(parentCategory.name)}"`}
              products={bestsellers}
              className="mb-10"
            />
          </LazySection>
        )}

        {/* New Products Carousel - Lazy loaded */}
        {newProducts.length > 0 && (
          <LazySection placeholderHeight="400px" rootMargin="300px">
            <section className="mb-10 rounded-lg bg-[#e8f4fd] px-6 py-6">
              <IdealoProductCarousel
                title={`Neu in ${formatTechText(parentCategory.name)}`}
                products={newProducts.map((p) => ({
                  id: p.id,
                  title: p.title || "Product",
                  subtitle: p.subtitle,
                  price: p.price || 0,
                  slug: p.slug || "",
                  image: p.image,
                  rating: p.rating,
                  ratingCount: p.reviewCount,
                  variationAttributes: p.variationAttributes,
                }))}
              />
            </section>
          </LazySection>
        )}

        {/* Deals Carousel - Lazy loaded */}
        {deals.length > 0 && (
          <LazySection placeholderHeight="400px" rootMargin="300px">
            <section className="mb-10 rounded-lg bg-white px-6 py-6 shadow-sm">
              <IdealoProductCarousel
                title={`Deals in "${formatTechText(parentCategory.name)}"`}
                products={deals.map((p) => ({
                  id: p.id,
                  title: p.title || "Deal",
                  price: p.price || 0,
                  slug: p.slug || "",
                  image: p.image,
                  rating: p.rating,
                  ratingCount: p.reviewCount,
                  categoryName:
                    p.category !== "uncategorized"
                      ? allCategories[p.category as CategorySlug]
                          ?.singularName ||
                        allCategories[p.category as CategorySlug]?.name
                      : undefined,
                  discountRate: p.savings
                    ? Math.round(p.savings * 100)
                    : undefined,
                  isBestseller: isProductBestseller(p),
                  isVariantGroup: p.isVariantGroup,
                  variationAttributes: p.variationAttributes,
                }))}
              />
            </section>
          </LazySection>
        )}
      </div>
    </div>
  );
}
