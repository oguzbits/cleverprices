import { Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

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
  type CategorySlug,
  getCategoryPath,
} from "@/lib/categories";
import { translateSpecKey } from "@/lib/constants/spec-translations";
import { type CountryCode } from "@/lib/countries";
import { type Product } from "@/lib/product-definitions";
import {
  getFamilyIdentity,
  getFamilyRepresentative,
} from "@/lib/product-families";
import { cn } from "@/lib/utils";
import { formatDisplayTitle } from "@/lib/utils/formatting";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { isProductBestseller } from "@/lib/utils/products";
import { getProductPath } from "@/lib/utils/url";
import { Category } from "@/types";

import { CachedVariantSelector } from "./CachedVariantSelector";
import { ConditionButtons } from "./ConditionButtons";
import { IdealoPriceChart } from "./IdealoPriceChart";
import { IdealoProductOffers } from "./IdealoProductOffers";
import { LivePriceHeader, LiveSavingsBadge } from "./LivePriceBoundary";
import { MobileActionGrid } from "./MobileActionGrid";
import { SpecificationsTable } from "./SpecificationsTable";

const EMPTY_ARRAY: any[] = [];

interface IdealoProductPageProps {
  product: Product;
  variants?: Product[];
  category?: Category;
  countryCode: CountryCode;
  selectedCondition?: "new" | "used" | "renewed";
  isParentView?: boolean;
  parentSlug?: string;
  parentTitle?: string;
  parentFullModel?: string;
  canonicalId?: number;
  similarSidebar?: Product[];
  similarCarousel?: Product[];
  searchParamsPromise?: Promise<{ condition?: string }>;
}

export function IdealoProductPage({
  product,
  variants = EMPTY_ARRAY,
  category,
  countryCode,
  isParentView = false,
  parentSlug: passedParentSlug,
  parentTitle: passedParentTitle,
  parentFullModel: passedFullModel,
  canonicalId,
  similarSidebar = EMPTY_ARRAY,
  similarCarousel = EMPTY_ARRAY,
  searchParamsPromise,
}: IdealoProductPageProps) {
  const mergedProduct = product;
  const rawVariants = variants;

  const identity = getProductIdentity(mergedProduct);
  const targetModelKey = (identity.modelTitle || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  const mergedVariants = rawVariants.filter((v) => {
    const vIden = getProductIdentity(v);
    const vModelKey = (vIden.modelTitle || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
    return vModelKey === targetModelKey;
  });

  const allFamilyMembers = [mergedProduct, ...mergedVariants];

  const representative =
    getFamilyRepresentative(allFamilyMembers) || mergedProduct;

  const repIdentity =
    representative.id === mergedProduct.id
      ? identity
      : getProductIdentity(representative);

  const realId = (canonicalId || representative.id || 0) % 100000000;
  const syntheticId = 900000000 + realId;
  const parentRep = { ...representative, syntheticId };
  const {
    slug: autoParentSlug,
    modelTitle: autoParentTitle,
    fullModel: autoFullModel,
  } = getFamilyIdentity({ ...parentRep, isParentView: true }, allFamilyMembers);

  const parentSlug = passedParentSlug || autoParentSlug;

  const parentTitle =
    passedParentTitle || autoParentTitle || repIdentity.modelTitle;
  const hubFullModel =
    passedFullModel || autoFullModel || repIdentity.fullModel;
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
          { name: parentTitle, href: getProductPath(syntheticId, parentSlug) },
          { name: variantName },
        ]),
  ];

  // Pre-calculate specifications for the summary section
  // This avoids JSON.parse and complex logic inside the JSX return,
  // making the component pure and compatible with the React Compiler.
  const displaySpecs = (() => {
    let rawSpecs: Record<string, any> = {};
    try {
      rawSpecs =
        (mergedProduct.officialSpecifications
          ? typeof mergedProduct.officialSpecifications === "string"
            ? JSON.parse(mergedProduct.officialSpecifications)
            : mergedProduct.officialSpecifications
          : mergedProduct.specifications) || {};
    } catch (e) {
      rawSpecs = mergedProduct.specifications || {};
    }

    return Object.entries(rawSpecs)
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
          /description|beschreibung|summary|marketing|ean|upc|gtin|asin/i.test(
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
      .map(([key, value]) => {
        const v = String(value).toLowerCase().trim();
        const isTrue = ["ja", "yes", "true", "1"].includes(v);

        const lowerKey = key.toLowerCase();
        let displayValue = String(value);
        if (isTrue) {
          displayValue = translateSpecKey(key);
        } else if (lowerKey === "modell" || lowerKey === "model") {
          displayValue = identity.fullModel;
        }

        return { key, displayValue };
      });
  })();

  return (
    <div className="bg-background min-h-screen">
      <ProductSchema
        product={mergedProduct}
        countryCode={countryCode}
        rating={product.rating || 4.5}
        reviewCount={product.reviewCount || 0}
        isHub={isParentView}
      />
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
                {isParentView && mergedVariants.length > 0 && (
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
                  ) : mergedProduct.image ? (
                    <Image
                      src={mergedProduct.image}
                      alt={mergedProduct.title}
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
                    <LivePriceHeader
                      productId={mergedProduct.id!}
                      countryCode={countryCode}
                      initialPrice={mergedProduct.prices[countryCode]}
                      livePriceData={{
                        price: mergedProduct.prices[countryCode] ?? null,
                        usedPrice:
                          mergedProduct.usedPrices?.[countryCode] ?? null,
                        warehousePrice:
                          mergedProduct.warehousePrices?.[countryCode] ?? null,
                      }}
                    />
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
                id="product-title"
                className="text-[20px] font-bold md:text-[24px]"
              >
                {isParentView ? parentTitle : identity.modelTitle}
                {!isParentView && identity.variantSuffix && (
                  <span className="ml-1.5 text-[16px] font-bold text-gray-500">
                    {identity.variantSuffix}
                  </span>
                )}
              </h1>
              <div className="oopStage-metaInfo mb-4 flex flex-wrap items-center gap-4 sm:justify-center lg:justify-start">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        viewBox="0 0 24 24"
                        fill={star <= 4 ? "black" : "#dcdcdc"}
                        className="h-3.5 w-3.5"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[13px] font-bold text-[#2d2d2d]">
                    ({mergedProduct.reviewCount || 10})
                  </span>
                </div>
                <LiveSavingsBadge
                  product={mergedProduct}
                  countryCode={countryCode}
                  liveSavings={mergedProduct.savings}
                />
              </div>
            </div>

            <div className="w-full min-w-0 flex-1 lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:-row-end-1 lg:justify-self-start lg:px-[15px]">
              <div className="oopStage-productInfo border-t border-[#dcdcdc] pt-4 lg:border-t-0 lg:pt-0">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 sm:justify-center lg:justify-start">
                  <b className="text-[13px] font-bold text-[#2d2d2d]">
                    Produktübersicht:
                  </b>
                  {displaySpecs.map((spec, i) => (
                    <React.Fragment key={spec.key}>
                      <span
                        className="inline-block max-w-[200px] truncate align-bottom text-[13px] text-[#2d2d2d]"
                        title={spec.displayValue}
                      >
                        {spec.displayValue}
                      </span>
                      {i < displaySpecs.length - 1 && (
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
                    href={`/search?q=${mergedProduct.brand}`}
                    className="text-[13px] text-[#0771d0] underline decoration-[#0771d0]/30 hover:no-underline"
                  >
                    {mergedProduct.brand}{" "}
                    {category?.singularName || category?.name}
                  </Link>
                </div>

                <div className="mt-4 w-full max-w-full overflow-hidden">
                  <ComponentErrorBoundary name="VariantSelector">
                    <CachedVariantSelector
                      product={mergedProduct}
                      variants={
                        isParentView
                          ? mergedVariants
                          : [mergedProduct, ...mergedVariants]
                      }
                      countryCode={countryCode}
                      isParentView={isParentView}
                      parentSlug={parentSlug}
                    />
                  </ComponentErrorBoundary>
                </div>

                <React.Suspense
                  fallback={
                    <div className="h-[44px] animate-pulse rounded bg-gray-100" />
                  }
                >
                  <DynamicConditionButtons
                    searchParamsPromise={searchParamsPromise}
                    product={mergedProduct}
                    countryCode={countryCode}
                    isParentView={isParentView}
                    parentSlug={parentSlug}
                    variants={mergedVariants}
                  />
                </React.Suspense>
              </div>
            </div>

            <div className="hidden px-0 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:-row-end-1 lg:block">
              <ComponentErrorBoundary name="PriceChart">
                <React.Suspense
                  fallback={
                    <div className="h-[200px] w-full animate-pulse rounded bg-gray-50" />
                  }
                >
                  <IdealoPriceChart
                    history={mergedProduct.priceHistory || []}
                    title={mergedProduct.title}
                    currentPrice={mergedProduct.prices[countryCode]}
                  />
                </React.Suspense>
              </ComponentErrorBoundary>
            </div>
          </div>

          <div className="oop-mainWrapper flex w-full flex-wrap">
            <aside
              id="sidebar"
              className="text-idealo-text-primary order-1 mb-[45px] hidden min-w-0 text-[14px] leading-[16px] xl:block xl:w-1/4 xl:pr-[15px]"
            >
              <ComponentErrorBoundary name="SidebarSimilarProducts">
                <SidebarSimilarProducts
                  similarProducts={similarSidebar}
                  countryCode={countryCode}
                />
              </ComponentErrorBoundary>
            </aside>

            <React.Suspense
              fallback={
                <div className="mt-8 h-[200px] animate-pulse rounded bg-gray-50" />
              }
            >
              <DynamicOfferSection
                searchParamsPromise={searchParamsPromise}
                product={mergedProduct}
                countryCode={countryCode}
                isParentView={isParentView}
                variants={mergedVariants}
              />
            </React.Suspense>
          </div>

          <div id="datasheet" className="scroll-mt-[10vh]">
            <ComponentErrorBoundary name="Specifications">
              <SpecificationsTable product={product} isHubMode={isParentView} />
            </ComponentErrorBoundary>
          </div>

          <ComponentErrorBoundary name="SimilarCarousel">
            <SimilarCarousel
              similarProducts={similarCarousel}
              countryCode={countryCode}
            />
          </ComponentErrorBoundary>
        </div>
      </div>
    </div>
  );
}

function SidebarSimilarProducts({
  similarProducts,
  countryCode,
}: {
  similarProducts: Product[];
  countryCode: CountryCode;
}) {
  if (!similarProducts?.length) return null;
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
                  fetchPriority="low"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={getProductPath(p.id, p.slug)}
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

function SimilarCarousel({
  similarProducts,
  countryCode,
}: {
  similarProducts: Product[];
  countryCode: CountryCode;
}) {
  if (!similarProducts?.length) return null;
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
            isBestseller: isProductBestseller(p),
          }))}
          countryCode={countryCode}
        />
      </div>
    </div>
  );
}

function ParentHeroImage({
  product,
  countryCode,
  variants = [],
}: {
  product: Product;
  countryCode: string;
  variants?: Product[];
}) {
  const uniqueImages: string[] = [];

  if (product.image) {
    uniqueImages.push(product.image);
  }
  variants.forEach((v) => {
    if (v.image && !uniqueImages.includes(v.image)) {
      uniqueImages.push(v.image);
    }
  });
  const allImages = uniqueImages.slice(0, 4);

  if (allImages.length === 1) {
    return (
      <div className="relative h-full w-full bg-white p-2">
        <Image
          src={allImages[0]!}
          alt=""
          fill
          className="object-contain"
          sizes="265px"
          priority
        />
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 gap-0.5 bg-white p-0">
      {allImages.map((img) => (
        <div key={img} className="relative aspect-square">
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

/**
 * Dynamic helper for condition buttons that satisfies Next.js 15 DynamicIO
 */
async function DynamicConditionButtons({
  searchParamsPromise,
  product,
  countryCode,
  isParentView,
  parentSlug,
  variants,
}: {
  searchParamsPromise?: Promise<{ condition?: string }>;
  product: Product;
  countryCode: CountryCode;
  isParentView: boolean;
  parentSlug: string;
  variants: Product[];
}) {
  const sp = searchParamsPromise ? await searchParamsPromise : {};
  const selectedCondition = sp.condition as "new" | "used" | "renewed";

  const effectiveCondition =
    selectedCondition || (product.condition === "Renewed" ? "renewed" : "new");

  return (
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
  );
}

/**
 * Dynamic helper for offers that satisfies Next.js 15 DynamicIO
 */
async function DynamicOfferSection({
  searchParamsPromise,
  product,
  countryCode,
  isParentView,
  variants,
}: {
  searchParamsPromise?: Promise<{ condition?: string }>;
  product: Product;
  countryCode: CountryCode;
  isParentView: boolean;
  variants: Product[];
}) {
  const sp = searchParamsPromise ? await searchParamsPromise : {};
  const selectedCondition = sp.condition as "new" | "used" | "renewed";

  const effectiveCondition =
    selectedCondition || (product.condition === "Renewed" ? "renewed" : "new");

  return (
    <ComponentErrorBoundary name="ProductOffers">
      <IdealoProductOffers
        product={product}
        productId={product.id!}
        countryCode={countryCode}
        selectedCondition={effectiveCondition}
        isParentView={isParentView}
        variants={variants}
      />
    </ComponentErrorBoundary>
  );
}
