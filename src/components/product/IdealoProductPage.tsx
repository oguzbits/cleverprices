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
import { getFamilyIdentity } from "@/lib/product-families";
import { getProductVariants, Product } from "@/lib/product-registry";
import { getSimilarProducts } from "@/lib/server/cached-products";
import { cn } from "@/lib/utils";
import { formatDisplayTitle } from "@/lib/utils/formatting";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { isProductBestseller } from "@/lib/utils/products";
import { Package } from "lucide-react";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { CachedVariantSelector } from "./CachedVariantSelector";
import { ConditionButtons } from "./ConditionButtons";
import { IdealoLivePrice, IdealoLivePriceSkeleton } from "./IdealoLivePrice";
import { IdealoPriceChart } from "./IdealoPriceChart";
import {
  IdealoProductOffers,
  IdealoProductOffersSkeleton,
} from "./IdealoProductOffers";
import { MobileActionGrid } from "./MobileActionGrid";
import { PriceAnalysisBadge } from "./PriceAnalysisBadge";
import { ProductVariantSelectorSkeleton } from "./ProductVariantSelector";
import { SpecificationsTable } from "./SpecificationsTable";

interface IdealoProductPageProps {
  product: Product;
  countryCode: CountryCode;
  selectedCondition?: "new" | "used" | "renewed";
  isParentView?: boolean;
  parentSlug?: string; // Stable hub slug from server
  parentTitle?: string; // Stable hub title from server
  parentFullModel?: string; // Stable hub full model name
}

export function IdealoProductPage({
  product,
  countryCode,
  selectedCondition,
  isParentView = false,
  parentSlug: passedParentSlug,
  parentTitle: passedParentTitle,
  parentFullModel: passedFullModel,
}: IdealoProductPageProps) {
  const category = getCategoryBySlug(product.category);

  // UNIVERSAL IDENTITY RESOLUTION
  const identity = getProductIdentity(product);

  const effectiveCondition =
    selectedCondition || (product.condition === "Renewed" ? "renewed" : "new");

  // Create a synthetic parent representative to generate the Hub URL for breadcrumbs
  // Use passedParentSlug if available (preferred for stability)
  const realId = (product.id || 0) % 100000000;
  const syntheticId = 900000000 + realId;
  const parentRep = { ...product, syntheticId };
  const { slug: autoParentSlug } = getFamilyIdentity(parentRep);
  const parentSlug = passedParentSlug || autoParentSlug;

  // Breadcrumb Data from Universal Identity - Ensure suffix matches visually
  const parentTitle = passedParentTitle || identity.modelTitle;
  const hubFullModel = passedFullModel || identity.fullModel;
  const variantName = identity.variantSuffix || "Standard";

  // Build breadcrumbs for SEO Schema (Idealo Style)
  const schemaBreadcrumbs = [
    { name: "Home", href: "/" },
    ...(category
      ? [
          {
            name: category.name,
            href: getCategoryPath(product.category as CategorySlug),
          },
        ]
      : []),
    ...(isParentView
      ? [{ name: hubFullModel }]
      : [
          { name: parentTitle, href: `/p/${parentSlug}` },
          {
            name: variantName,
          },
        ]),
  ];

  return (
    <div className="bg-background min-h-screen">
      <ProductSchema
        product={product}
        countryCode={countryCode}
        rating={product.rating ?? 4.5}
        reviewCount={product.reviewCount ?? 0}
      />
      <BreadcrumbSchema items={schemaBreadcrumbs} />

      {/* Performance Hints: Preconnect to Amazon Image domains */}
      <link rel="preconnect" href="https://m.media-amazon.com" />
      <link rel="dns-prefetch" href="https://m.media-amazon.com" />

      <div className="mx-auto max-w-[1280px] px-4">
        <Breadcrumbs
          items={schemaBreadcrumbs}
          className="mb-[10px] py-0 pt-3"
        />

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
                {isParentView && (
                  <div className="mb-2 flex justify-center">
                    <div className="rounded-full bg-[#ffb900] px-[10px] py-[5px] text-[14px] font-medium whitespace-nowrap text-black shadow-sm">
                      Keine Variante ausgewählt.
                    </div>
                  </div>
                )}
                <div className="bg-card relative mx-auto flex aspect-square w-full max-w-[265px] items-center justify-center overflow-hidden rounded-lg">
                  {isParentView ? (
                    <Suspense
                      fallback={
                        <div className="flex h-full w-full items-center justify-center bg-gray-50">
                          <Package className="h-12 w-12 text-gray-200" />
                        </div>
                      }
                    >
                      <ParentHeroImage
                        product={product}
                        countryCode={countryCode}
                      />
                    </Suspense>
                  ) : product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 265px) calc(100vw - 80px), 265px"
                      quality={30}
                      priority
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-full items-center justify-center">
                      <Package className="h-24 w-24 stroke-1" />
                    </div>
                  )}
                </div>

                {/* Mobile: Big Price & Button Display */}
                <div className="flex flex-col items-center lg:hidden">
                  <div className="mb-4 text-[24px] font-extrabold text-[#2d2d2d]">
                    <Suspense
                      fallback={
                        <IdealoLivePriceSkeleton className="h-8 w-24" />
                      }
                    >
                      <IdealoLivePrice
                        productId={product.id!}
                        countryCode={countryCode}
                        initialPrice={product.prices[countryCode]}
                        className="text-[28px] font-black text-[#2d2d2d]"
                      />
                    </Suspense>
                  </div>

                  <a
                    href="#offerList"
                    className="flex h-[44px] w-full items-center justify-center rounded-[4px] border border-[#0771d0] px-4 text-[14px] font-bold text-[#0771d0] transition-colors hover:bg-blue-50"
                  >
                    Angebote vergleichen
                  </a>
                </div>

                <MobileActionGrid />

                {/* Mobile: Price Alert Button */}
              </div>
            </div>

            {/* Title & Rating */}
            <div className="col-start-1 row-start-1 min-w-0 flex-1 px-2.5 sm:px-[15px] lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:px-[15px]">
              <h1
                id="oopStage-title"
                className="text-idealo-text-primary mb-1 line-clamp-2 min-h-[50px] text-[20px] leading-tight font-bold sm:text-center lg:text-left"
              >
                {identity.modelTitle}
                {!isParentView && identity.variantSuffix && (
                  <span className="ml-2 text-[16px] font-bold">
                    {identity.variantSuffix}
                  </span>
                )}
              </h1>
              <div className="oopStage-metaInfo mb-4 flex flex-wrap items-center gap-4 sm:justify-center lg:justify-start">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg
                        key={i}
                        viewBox="0 0 24 24"
                        fill={i <= 4 ? "black" : "#dcdcdc"}
                        className="h-3.5 w-3.5"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[13px] font-bold text-[#2d2d2d]">
                    ({product.reviewCount || 10})
                  </span>
                </div>

                {(product.savings || 0) > 0 && (
                  <PriceAnalysisBadge savings={product.savings || 0} />
                )}
              </div>
            </div>

            {/* Product Overview */}
            <div className="w-full min-w-0 flex-1 lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:-row-end-1 lg:justify-self-start lg:px-[15px]">
              <div className="oopStage-productInfo border-t border-[#dcdcdc] pt-4 lg:border-t-0 lg:pt-0">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 sm:justify-center lg:justify-start">
                  <b className="text-[13px] font-bold text-[#2d2d2d]">
                    Produktübersicht:
                  </b>
                  {Object.entries(
                    (product.officialSpecifications
                      ? typeof product.officialSpecifications === "string"
                        ? JSON.parse(product.officialSpecifications)
                        : product.officialSpecifications
                      : product.specifications) || {},
                  )
                    .filter(([key, value]) => {
                      if (!isParentView) return true;
                      // HUB MODE: Filter out variant-specific traits
                      const k = key.toLowerCase();
                      const unwanted = [
                        "color",
                        "farbe",
                        "mpn",
                        "ean",
                        "herstellernummer",
                        "part number",
                        "kapazität",
                        "storage",
                        "speicher",
                        "ram",
                        "memory",
                        "arbeitsspeicher",
                        "größe",
                        "size",
                      ];
                      if (unwanted.some((u) => k.includes(u))) return false;

                      const v = String(value).toLowerCase().trim();
                      // Filter out description-like keys
                      if (
                        /description|summary|marketing|ean|upc|gtin|asin/i.test(
                          key,
                        )
                      )
                        return false;
                      // Filter out negative/useless values
                      if (
                        [
                          "nein",
                          "no",
                          "false",
                          "0",
                          "n/a",
                          "nicht unterstützt",
                          "not supported",
                          "null",
                          "undefined",
                          "nicht verfügbar",
                        ].includes(v)
                      )
                        return false;
                      // Specs are usually short (e.g. "16 GB", "SSD"). Sentences are not specs.
                      if (v.length === 0 || v.length >= 40) return false;

                      // SELF-EXPLANATORY CHECK:
                      // Must contain at least one letter (for units like GB, Hz, or text)
                      // OR contain specific symbols like " (inches), % (percent), or x (resolution 1920x1080)
                      // This rejects pure numbers like "4096" or "1" which are confusing without labels.
                      const isSelfExplanatory =
                        /[a-z%"]/i.test(v) || /\d\s*x\s*\d/.test(v);
                      return isSelfExplanatory;
                    })
                    .slice(0, 5) // Increased back to 5 now that we filter bad ones
                    .map(([key, value], i) => (
                      <React.Fragment key={key}>
                        <span
                          className="inline-block max-w-[200px] truncate align-bottom text-[13px] text-[#2d2d2d]"
                          title={String(value)}
                        >
                          {String(value)}
                        </span>
                        {i < 4 && (
                          <span className="text-[13px] text-[#767676]">·</span>
                        )}
                      </React.Fragment>
                    ))}
                </div>

                {/* Similar Products Links Row */}
                <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 sm:justify-center lg:justify-start">
                  <b className="text-[13px] font-bold text-[#2d2d2d]">
                    Ähnliche Produkte:
                  </b>
                  <Link
                    href={`/search?q=${category?.name}`}
                    className="text-[13px] text-[#0771d0] underline decoration-[#0771d0]/30 hover:no-underline"
                  >
                    {category?.name}
                  </Link>
                  <span className="text-[13px] text-[#767676]">·</span>
                  <Link
                    href={`/search?q=${product.brand}`}
                    className="text-[13px] text-[#0771d0] underline decoration-[#0771d0]/30 hover:no-underline"
                  >
                    {product.brand} {category?.singularName || category?.name}
                  </Link>
                </div>

                {/* Variant Selector (scoped to selected condition) - Always render now, let it decide */}
                <div className="mt-4 w-full max-w-full overflow-hidden">
                  <ComponentErrorBoundary name="VariantSelector">
                    <Suspense fallback={<ProductVariantSelectorSkeleton />}>
                      <CachedVariantSelector
                        product={product}
                        countryCode={countryCode}
                        isParentView={isParentView}
                        selectedCondition={effectiveCondition}
                        parentSlug={parentSlug}
                      />
                    </Suspense>
                  </ComponentErrorBoundary>
                </div>

                {/* Condition Buttons */}
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Suspense
                    fallback={
                      <div className="h-14 w-full animate-pulse bg-gray-100" />
                    }
                  >
                    <ConditionButtons
                      product={product}
                      countryCode={countryCode}
                      effectiveCondition={effectiveCondition}
                      isParentView={isParentView}
                      parentSlug={parentSlug}
                    />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* Price Chart Column */}
            <div className="hidden px-0 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:-row-end-1 lg:block">
              <ComponentErrorBoundary name="PriceChart">
                <IdealoPriceChart
                  history={product.priceHistory || []}
                  title={product.title}
                  currentPrice={product.prices[countryCode]}
                />
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
                    countryCode={countryCode}
                  />
                </Suspense>
              </ComponentErrorBoundary>
            </aside>

            {/* Offers Section (DB only) */}
            <ComponentErrorBoundary name="ProductOffers">
              <Suspense fallback={<IdealoProductOffersSkeleton />}>
                <IdealoProductOffers
                  product={product}
                  productId={product.id!}
                  countryCode={countryCode}
                  selectedCondition={effectiveCondition}
                  isParentView={isParentView}
                />
              </Suspense>
            </ComponentErrorBoundary>
          </div>

          {/* Specifications Table (Bottom) */}
          <div id="datasheet" className="scroll-mt-[10vh]">
            <ComponentErrorBoundary name="Specifications">
              <Suspense
                fallback={
                  <div className="bg-muted h-[300px] w-full animate-pulse rounded" />
                }
              >
                <CachedSpecifications
                  product={product}
                  selectedCondition={effectiveCondition}
                  isHubMode={isParentView}
                />
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
                  product={product}
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
  countryCode,
}: {
  product: Product;
  countryCode: CountryCode;
}) {
  "use cache";
  cacheLife("product");

  // Fetch similar products internally for streaming
  const similarProducts = await getSimilarProducts(product, 5, countryCode);
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
                href={`/p/${p.slug.includes("_-") ? p.slug : `${200000000 + (p.id || 0)}_-${p.slug}`}`}
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

async function CachedSpecifications({
  product,
  selectedCondition,
  isHubMode,
}: {
  product: Product;
  selectedCondition?: "new" | "used" | "renewed";
  isHubMode?: boolean;
}) {
  "use cache";
  cacheLife("product");
  return (
    <SpecificationsTable
      product={product}
      selectedCondition={selectedCondition}
      isHubMode={isHubMode}
    />
  );
}

async function CachedSimilarCarousel({
  product,
  countryCode,
}: {
  product: Product;
  countryCode: CountryCode;
}) {
  "use cache";
  cacheLife("product");

  // Fetch similar products internally for streaming
  const similarProducts = await getSimilarProducts(product, 12, countryCode);
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
            discountRate: p.savings ? Math.round(p.savings * 100) : undefined,
            // @ts-ignore - Product type is slightly different but compatible
            isBestseller: isProductBestseller(p),
          }))}
          countryCode={countryCode}
        />
      </div>
    </div>
  );
}

async function ParentHeroImage({
  product,
  countryCode,
}: {
  product: Product;
  countryCode: string;
}) {
  const variants = await getProductVariants(product, countryCode);
  const uniqueImages: string[] = [];
  variants.forEach((v) => {
    if (v.image && !uniqueImages.includes(v.image)) {
      uniqueImages.push(v.image);
    }
  });
  const allImages = uniqueImages.slice(0, 4);

  return (
    <div className="grid h-full w-full grid-cols-2 gap-0.5 bg-white p-0">
      {allImages.map((img, i) => (
        <div key={i} className="relative aspect-square">
          <Image
            src={img!}
            alt=""
            fill
            className="object-contain mix-blend-multiply"
            sizes="120px"
            quality={20}
          />
        </div>
      ))}
      {Array.from({ length: Math.max(0, 4 - allImages.length) }).map((_, i) => (
        <div key={`empty-${i}`} className="aspect-square bg-gray-50" />
      ))}
    </div>
  );
}
