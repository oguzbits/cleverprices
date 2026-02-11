import { Breadcrumbs } from "@/components/breadcrumbs";
import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import {
  BreadcrumbSchema,
  ProductSchema,
} from "@/components/seo/ProductSchema";
import { ComponentErrorBoundary } from "@/components/ui/ComponentErrorBoundary";
import { LegalPrice } from "@/components/ui/LegalPrice";
import {
  allCategories,
  getCategoryPath,
  type CategorySlug,
} from "@/lib/categories";
import { type CountryCode } from "@/lib/countries";
import { getFamilyIdentity } from "@/lib/product-families";
import { Product } from "@/lib/product-registry";
import {
  getProductVariants,
  getSimilarProducts,
} from "@/lib/server/cached-products";
import { mergeLivePrices } from "@/lib/server/live-data";
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
import { IdealoPriceChart } from "./IdealoPriceChart";
import { IdealoProductOffers } from "./IdealoProductOffers";
import { MobileActionGrid } from "./MobileActionGrid";
import { SpecificationsTable } from "./SpecificationsTable";

import {
  LivePriceBoundary,
  LivePriceHeader,
  LiveSavingsBadge,
} from "./LivePriceBoundary";

interface IdealoProductPageProps {
  product: Product;
  variants?: Product[];
  category?: any;
  countryCode: CountryCode;
  selectedCondition?: "new" | "used" | "renewed";
  isParentView?: boolean;
  parentSlug?: string;
  parentTitle?: string;
  parentFullModel?: string;
}

export async function IdealoProductPage({
  product,
  variants = [],
  category,
  countryCode,
  selectedCondition,
  isParentView: initialIsParentView = false,
  parentSlug: passedParentSlug,
  parentTitle: passedParentTitle,
  parentFullModel: passedFullModel,
}: IdealoProductPageProps) {
  const isParentView = initialIsParentView;
  const identity = getProductIdentity(product);
  const effectiveCondition =
    selectedCondition || (product.condition === "Renewed" ? "renewed" : "new");

  const realId = (product.id || 0) % 100000000;
  const syntheticId = 900000000 + realId;
  const parentRep = { ...product, syntheticId };
  const { slug: autoParentSlug } = getFamilyIdentity(parentRep);
  const parentSlug = passedParentSlug || autoParentSlug;

  const parentTitle = passedParentTitle || identity.modelTitle;
  const hubFullModel = passedFullModel || identity.fullModel;
  const variantName = identity.variantSuffix || "Standard";

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
          { name: variantName },
        ]),
  ];

  return (
    <div className="bg-background min-h-screen">
      <ProductSchema product={product} countryCode={countryCode} />
      <BreadcrumbSchema items={schemaBreadcrumbs} />

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
                    <ParentHeroImage
                      product={product}
                      countryCode={countryCode}
                      variants={variants}
                    />
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

                <div className="flex flex-col items-center lg:hidden">
                  <div className="mb-4 text-[24px] font-extrabold text-[#2d2d2d]">
                    <Suspense
                      fallback={
                        <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />
                      }
                    >
                      <LivePriceHeader
                        productId={product.id!}
                        countryCode={countryCode}
                        initialPrice={product.prices[countryCode]}
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
              </div>
            </div>

            <div className="col-start-1 row-start-1 min-w-0 flex-1 px-2.5 sm:px-[15px] lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:px-[15px]">
              <h1
                id="oopStage-title"
                className="text-idealo-text-primary mb-1 line-clamp-2 min-h-[50px] text-[20px] leading-tight font-bold sm:text-center lg:text-left"
              >
                {isParentView
                  ? hubFullModel
                  : product.subtitle
                    ? product.title.replace(product.subtitle, "").trim()
                    : product.title}
                {!isParentView && product.subtitle && (
                  <span className="ml-2 text-[16px] font-bold">
                    {product.subtitle}
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
                <Suspense
                  fallback={
                    <div className="h-6 w-24 animate-pulse rounded-full bg-blue-50" />
                  }
                >
                  <LiveSavingsBadge
                    product={product}
                    countryCode={countryCode}
                  />
                </Suspense>
              </div>
            </div>

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
                      const k = key.toLowerCase();
                      const unwanted = [
                        "color",
                        "farbe",
                        "mpn",
                        "ean",
                        "herstellernummer",
                        "teilenummer",
                        "part number",
                        "part-number",
                        "artikelnummer",
                        "sku",
                        "kapazität",
                        "storage",
                        "speicher",
                        "ram",
                        "memory",
                        "arbeitsspeicher",
                        "konnektivität",
                        "connectivity",
                        "mobilfunk",
                        "größe",
                        "size",
                      ];
                      if (unwanted.some((u) => k.includes(u))) return false;
                      const v = String(value).toLowerCase().trim();
                      if (
                        /description|summary|marketing|ean|upc|gtin|asin/i.test(
                          key,
                        )
                      )
                        return false;
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
                      if (v.length === 0 || v.length >= 40) return false;
                      return /[a-z%"]/i.test(v) || /\d\s*x\s*\d/.test(v);
                    })
                    .slice(0, 5)
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

                <div className="mt-4 w-full max-w-full overflow-hidden">
                  <ComponentErrorBoundary name="VariantSelector">
                    <CachedVariantSelector
                      product={product}
                      variants={variants}
                      countryCode={countryCode}
                      isParentView={isParentView}
                      selectedCondition={effectiveCondition}
                      parentSlug={parentSlug}
                    />
                  </ComponentErrorBoundary>
                </div>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <ConditionButtons
                    product={product}
                    countryCode={countryCode}
                    effectiveCondition={effectiveCondition}
                    isParentView={isParentView}
                    parentSlug={parentSlug}
                    variants={variants}
                  />
                </div>
              </div>
            </div>

            <div className="hidden px-0 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:-row-end-1 lg:block">
              <ComponentErrorBoundary name="PriceChart">
                <Suspense
                  fallback={
                    <div className="h-[250px] w-full animate-pulse rounded border border-gray-100 bg-gray-50/30" />
                  }
                >
                  <PriceChartBoundary
                    product={product}
                    countryCode={countryCode}
                  />
                </Suspense>
              </ComponentErrorBoundary>
            </div>
          </div>

          <div className="oop-mainWrapper flex w-full flex-wrap">
            <aside
              id="sidebar"
              className="text-idealo-text-primary order-1 mb-[45px] hidden min-w-0 text-[14px] leading-[16px] xl:block xl:w-1/4 xl:pr-[15px]"
            >
              <ComponentErrorBoundary name="SidebarSimilarProducts">
                <CachedSidebarSimilarProducts
                  product={product}
                  countryCode={countryCode}
                />
              </ComponentErrorBoundary>
            </aside>

            <Suspense
              fallback={
                <div className="min-h-[400px] w-full animate-pulse bg-gray-50 lg:w-3/4" />
              }
            >
              <LivePriceBoundary
                product={product}
                variants={variants}
                countryCode={countryCode}
              >
                {({ mergedProduct, mergedVariants }) => (
                  <ComponentErrorBoundary name="ProductOffers">
                    <IdealoProductOffers
                      product={mergedProduct}
                      productId={mergedProduct.id!}
                      countryCode={countryCode}
                      selectedCondition={effectiveCondition}
                      isParentView={isParentView}
                      variants={mergedVariants}
                    />
                  </ComponentErrorBoundary>
                )}
              </LivePriceBoundary>
            </Suspense>
          </div>

          <div id="datasheet" className="scroll-mt-[10vh]">
            <ComponentErrorBoundary name="Specifications">
              <CachedSpecifications
                product={product}
                selectedCondition={effectiveCondition}
                isHubMode={isParentView}
              />
            </ComponentErrorBoundary>
          </div>

          <ComponentErrorBoundary name="SimilarCarousel">
            <Suspense
              fallback={
                <div className="mt-12 h-64 w-full animate-pulse rounded-lg bg-gray-50" />
              }
            >
              <CachedSimilarCarousel
                product={product}
                countryCode={countryCode}
              />
            </Suspense>
          </ComponentErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// Sub-component to handle Price Chart with live data
async function PriceChartBoundary({
  product,
  countryCode,
}: {
  product: Product;
  countryCode: string;
}) {
  const [merged] = await mergeLivePrices([product], countryCode);
  return (
    <IdealoPriceChart
      history={merged.priceHistory || []}
      title={merged.title}
      currentPrice={merged.prices[countryCode]}
    />
  );
}

/**
 * --- CACHED COMPONENTS (Next.js 16 Granular Caching) ---
 * Each of these is rendered once and stored as static Rsc in the Data Cache.
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
            slug: p.slug,
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
  variants: passedVariants,
}: {
  product: Product;
  countryCode: string;
  variants?: Product[];
}) {
  const variants =
    passedVariants || (await getProductVariants(product, countryCode));
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
