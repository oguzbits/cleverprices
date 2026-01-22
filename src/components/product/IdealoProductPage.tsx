import { Breadcrumbs } from "@/components/breadcrumbs";
import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import {
  BreadcrumbSchema,
  ProductSchema,
} from "@/components/seo/ProductSchema";
import { ComponentErrorBoundary } from "@/components/ui/ComponentErrorBoundary";
import { LazySection } from "@/components/ui/LazySection";
import { LegalPrice } from "@/components/ui/LegalPrice";
import {
  allCategories,
  getCategoryBySlug,
  getCategoryPath,
  type CategorySlug,
} from "@/lib/categories";
import { type CountryCode } from "@/lib/countries";
import { Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import { formatDisplayTitle } from "@/lib/utils/formatting";
import { isProductBestseller } from "@/lib/utils/products";
import { Check, Package } from "lucide-react";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { IdealoStarRating } from "../category/IdealoStarRating";
import { IdealoPriceChart } from "./IdealoPriceChart";
import {
  IdealoLivePrice,
  IdealoLivePriceSkeleton,
  IdealoProductOffers,
} from "./IdealoProductOffers";
import { PriceAnalysisBadge } from "./PriceAnalysisBadge";
import { SpecificationsTable } from "./SpecificationsTable";

interface IdealoProductPageProps {
  product: Product;
  countryCode: CountryCode;
  selectedCondition?: "new" | "used";
  similarProducts?: Product[];
}

export function IdealoProductPage({
  product,
  countryCode,
  selectedCondition = "new",
  similarProducts = [],
}: IdealoProductPageProps) {
  const category = getCategoryBySlug(product.category);

  // Use centralized title splitting logic
  const shortTitle = formatDisplayTitle(
    product.title,
    product.specifications?.Model as string,
  );

  // Build breadcrumbs
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    ...(category
      ? [
          {
            name: category.name,
            href: getCategoryPath(product.category as CategorySlug),
          },
        ]
      : []),
    { name: shortTitle },
  ];

  const displayTitle = shortTitle;

  return (
    <div className="bg-background min-h-screen">
      <ProductSchema
        product={product}
        countryCode={countryCode}
        rating={product.rating ?? 4.5}
        reviewCount={product.reviewCount ?? 0}
      />
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Performance Hints: Preconnect to Amazon Image domains */}
      <link rel="preconnect" href="https://m.media-amazon.com" />
      <link rel="dns-prefetch" href="https://m.media-amazon.com" />

      <div className="mx-auto max-w-[1280px] px-4">
        <Breadcrumbs items={breadcrumbItems} className="mb-[10px] py-0 pt-3" />

        <div className="text-[14px]">
          <div
            className={cn(
              "oopStage",
              "mb-6 grid grid-cols-1 grid-rows-[auto_auto_auto] gap-0 lg:grid-cols-[1fr_2fr_1fr] lg:grid-rows-[auto_auto]",
            )}
          >
            {/* Gallery */}
            <div className="min-w-0 flex-1 px-2.5 sm:px-0 lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:-row-end-1">
              <div className="oopStage-gallery">
                <div className="bg-card relative mx-auto aspect-square w-full max-w-[400px]">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 432px) calc(100vw - 80px), 320px"
                      quality={30}
                      priority
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-full items-center justify-center">
                      <Package className="h-24 w-24 stroke-1" />
                    </div>
                  )}
                </div>

                {/* Mobile Price CTA - Now Live/Skeleton */}
                <div className="mt-4 rounded border border-gray-200 p-4 lg:hidden">
                  <a
                    href="#offerList"
                    className="focus-visible:ring-idealo-blue flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    <Suspense
                      fallback={
                        <IdealoLivePriceSkeleton className="h-6 w-20" />
                      }
                    >
                      <IdealoLivePrice
                        product={product}
                        countryCode={countryCode}
                        className="text-idealo-text-primary text-lg font-extrabold"
                      />
                    </Suspense>
                    <span className="text-idealo-blue text-sm font-semibold">
                      Zum Preisvergleich
                    </span>
                  </a>
                </div>

                {/* Mobile: Price Alert Button */}
              </div>
            </div>

            {/* Title & Rating */}
            <div className="col-start-1 row-start-1 min-w-0 flex-1 px-2.5 sm:px-[15px] lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:pl-[25px]">
              <h1
                id="oopStage-title"
                className="text-idealo-text-primary mb-1 text-[20px] leading-tight font-bold"
              >
                {displayTitle}
              </h1>
              <div className="oopStage-metaInfo mb-4 flex flex-wrap items-center gap-4">
                <IdealoStarRating
                  rating={product.rating || 4.5}
                  reviewCount={product.reviewCount || 0}
                />

                {(product.savings || 0) > 0 && (
                  <PriceAnalysisBadge savings={product.savings || 0} />
                )}
              </div>
            </div>

            {/* Product Overview */}
            <div className="w-full min-w-0 flex-1 lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:-row-end-1 lg:justify-self-start lg:pl-[25px]">
              <div className="oopStage-productInfo mb-5">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                  <b className="font-bold">Produktübersicht:</b>
                  {Object.entries(product.specifications || {})
                    .slice(0, 5)
                    .map(([key, value], i) => (
                      <React.Fragment key={key}>
                        <span className="oopStage-productInfoTopItem inline-block">
                          {String(value)}
                        </span>
                        {i < 4 && (
                          <span className="text-idealo-text-primary mx-0.5">
                            ·
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  <a
                    href="#datasheet"
                    className="text-idealo-blue focus-visible:ring-idealo-blue ml-1 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-offset-1"
                  >
                    Produktdetails
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  {/* NEW OFFERS BOX */}
                  <Link
                    href="?condition=new"
                    scroll={false}
                    className={cn(
                      "flex min-w-[140px] flex-col items-center justify-center rounded-[4px] border px-4 py-2 transition-all outline-none",
                      selectedCondition === "new"
                        ? "border-[#0771d0] bg-white ring-1 ring-[#0771d0]"
                        : "border-[#b4b4b4] bg-white hover:border-[#888]",
                    )}
                  >
                    <div className="relative w-full">
                      {selectedCondition === "new" && (
                        <Check className="absolute -top-1 -left-2 h-3.5 w-3.5 text-[#0771d0]" />
                      )}
                      <div className="text-idealo-text-primary text-center text-[13px] font-bold">
                        Neu ab
                      </div>
                    </div>
                    <div className="text-idealo-text-primary text-[15px] font-extrabold">
                      <Suspense
                        fallback={
                          <IdealoLivePriceSkeleton className="h-5 w-16" />
                        }
                      >
                        <IdealoLivePrice
                          product={product}
                          countryCode={countryCode}
                        />
                      </Suspense>
                    </div>
                  </Link>

                  {/* USED OFFERS BOX */}
                  {product.usedPrices?.[countryCode] && (
                    <Link
                      href="?condition=used"
                      scroll={false}
                      className={cn(
                        "flex min-w-[140px] flex-col items-center justify-center rounded-[4px] border px-4 py-2 transition-all outline-none",
                        selectedCondition === "used"
                          ? "border-[#0771d0] bg-white ring-1 ring-[#0771d0]"
                          : "border-[#b4b4b4] bg-white hover:border-[#888]",
                      )}
                    >
                      <div className="relative w-full">
                        {selectedCondition === "used" && (
                          <Check className="absolute -top-1 -left-2 h-3.5 w-3.5 text-[#0771d0]" />
                        )}
                        <div className="text-idealo-text-primary text-center text-[13px] font-bold">
                          Gebraucht ab
                        </div>
                      </div>
                      <div className="text-idealo-text-primary text-[15px] font-extrabold">
                        <LegalPrice
                          price={product.usedPrices[countryCode]}
                          priceClassName="text-idealo-text-primary text-[15px] font-extrabold"
                        />
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Price Chart Column */}
            <div className="hidden px-0 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:-row-end-1 lg:block">
              <ComponentErrorBoundary name="PriceChart">
                <IdealoPriceChart history={product.priceHistory || []} />
              </ComponentErrorBoundary>
            </div>
          </div>

          <div className="oop-mainWrapper flex w-full flex-wrap">
            <aside
              id="sidebar"
              className="text-idealo-text-primary order-1 mb-[45px] hidden min-w-0 text-[14px] leading-[16px] xl:block xl:w-1/4 xl:pr-[15px]"
            >
              <ComponentErrorBoundary name="SidebarSimilarProducts">
                <Suspense
                  fallback={
                    <div className="bg-muted h-[400px] w-full animate-pulse rounded" />
                  }
                >
                  <CachedSidebarSimilarProducts
                    product={product}
                    similarProducts={similarProducts.slice(0, 5)}
                    countryCode={countryCode}
                  />
                </Suspense>
              </ComponentErrorBoundary>
            </aside>

            {/* Offers Section (DB only) */}
            <IdealoProductOffers
              product={product}
              countryCode={countryCode}
              selectedCondition={selectedCondition}
            />
          </div>

          {/* Specifications Table (Bottom) */}
          <div id="datasheet" className="scroll-mt-[10vh]">
            <ComponentErrorBoundary name="Specifications">
              <Suspense
                fallback={
                  <div className="bg-muted h-[300px] w-full animate-pulse rounded" />
                }
              >
                <CachedSpecifications product={product} />
              </Suspense>
            </ComponentErrorBoundary>
          </div>

          {/* Similar Products Carousel */}
          <ComponentErrorBoundary name="SimilarCarousel">
            <Suspense
              fallback={
                <div className="h-[400px] w-full animate-pulse rounded bg-gray-50" />
              }
            >
              <LazySection placeholderHeight="400px" rootMargin="0px">
                <CachedSimilarCarousel
                  similarProducts={similarProducts}
                  countryCode={countryCode}
                />
              </LazySection>
            </Suspense>
          </ComponentErrorBoundary>
        </div>
      </div>
    </div>
  );
}

/**
 * --- CACHED COMPONENTS (Next.js 16 Granular Caching) ---
 * Each of these is rendered once and stored as static Rsc in the Vercel Data Cache.
 */

// Live Price Chart that prefers fresh data from Keepa

async function CachedSidebarSimilarProducts({
  product,
  similarProducts,
  countryCode,
}: {
  product: Product;
  similarProducts: Product[];
  countryCode: CountryCode;
}) {
  "use cache";
  cacheLife("fast");
  return (
    <section
      id="recommendedProducts"
      className="bg-secondary mb-0.5 rounded-md p-4"
    >
      <h2 className="oopMarginal-wrapperTitle text-idealo-text-primary mb-4 text-[16px] font-bold">
        Ähnliche Produkte
      </h2>
      <ul className="space-y-3">
        {similarProducts.map((p) => (
          <li
            key={p.slug}
            className="bg-card flex cursor-pointer items-start gap-3 rounded p-2 transition-colors hover:shadow-sm"
          >
            <div className="bg-card relative h-14 w-14 shrink-0 overflow-hidden rounded">
              {p.image && (
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  className="object-contain p-1.5"
                  sizes="56px"
                  quality={30}
                  loading="lazy"
                  // @ts-ignore
                  fetchPriority="low"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/p/${p.slug}`}
                className="text-idealo-text-primary! hover:text-primary! focus-visible:ring-idealo-blue line-clamp-2 block text-[12px] font-bold underline! outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              >
                {formatDisplayTitle(p.title)}
              </Link>
              <div className="text-idealo-text-primary mt-1 text-[12px] font-bold!">
                <LegalPrice price={p.prices[countryCode]} showAb />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function CachedSpecifications({ product }: { product: Product }) {
  "use cache";
  cacheLife("product");
  return <SpecificationsTable product={product} />;
}

async function CachedSimilarCarousel({
  similarProducts,
  countryCode,
}: {
  similarProducts: Product[];
  countryCode: CountryCode;
}) {
  "use cache";
  cacheLife("fast");
  return (
    <div className="bg-secondary -mx-4 mt-12 px-4 py-8">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="text-idealo-text-primary mb-6 text-xl font-bold">
          Auch interessant
        </h2>
        <IdealoProductCarousel
          products={similarProducts.map((p) => ({
            ...p,
            price: p.prices[countryCode],
            categoryName:
              p.category !== "uncategorized"
                ? allCategories[p.category as CategorySlug]?.singularName ||
                  allCategories[p.category as CategorySlug]?.name
                : undefined,
            // @ts-ignore - Product type is slightly different but compatible
            isBestseller: isProductBestseller(p),
          }))}
          countryCode={countryCode}
        />
      </div>
    </div>
  );
}
