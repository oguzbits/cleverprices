/**
 * Idealo Product Stage
 *
 * Faithful recreation of Idealo's product page layout.
 * Based on Idealo's actual HTML/CSS structure.
 *
 * Grid Layout (Desktop):
 * | Column 1 (1fr)    | Column 2 (2fr)         | Column 3 (1fr)  |
 * |-------------------|------------------------|-----------------|
 * | Gallery           | Title + Favorites      | Price Chart     |
 * | (spans all rows)  | Meta Info + Details    | (spans all)     |
 */

import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  BreadcrumbSchema,
  ProductSchema,
} from "@/components/seo/ProductSchema";
import { getAffiliateRedirectPath } from "@/lib/affiliate-utils";
import {
  getCategoryBySlug,
  getCategoryPath,
  type CategorySlug,
} from "@/lib/categories";
import { getCountryByCode, type CountryCode } from "@/lib/countries";
import type { ProductOffer, UnifiedProduct } from "@/lib/data-sources";
import { Product, getSimilarProducts } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatting";
import { Check, ChevronRight, Heart, Package, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { IdealoPriceChart } from "./IdealoPriceChart";
import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import { SpecificationsTable } from "./SpecificationsTable";

interface IdealoProductPageProps {
  product: Product;
  countryCode: CountryCode;
  unifiedProduct?: UnifiedProduct | null;
}

export async function IdealoProductPage({
  product,
  countryCode,
  unifiedProduct,
}: IdealoProductPageProps) {
  const countryConfig = getCountryByCode(countryCode);
  const category = getCategoryBySlug(product.category);
  const similarProducts = await getSimilarProducts(product, 12, countryCode);
  const price = product.prices[countryCode];

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
    { name: product.title.split(" ").slice(0, 5).join(" ") },
  ];

  // Get offers
  const offers: ProductOffer[] = unifiedProduct?.offers || [];
  if (offers.length === 0 && price) {
    offers.push({
      source: "amazon" as const,
      price,
      currency: countryConfig?.currency || "EUR",
      displayPrice: formatCurrency(price, countryCode),
      affiliateLink: getAffiliateRedirectPath(product.slug),
      condition: product.condition.toLowerCase() as "new" | "renewed" | "used",
      availability: "in_stock" as const,
      freeShipping: true,
      seller: "Amazon",
      country: countryCode,
    });
  }

  const bestPrice = offers[0]?.price || price;

  return (
    <div className="min-h-screen bg-white">
      <ProductSchema
        product={product}
        countryCode={countryCode}
        rating={unifiedProduct?.rating}
        reviewCount={unifiedProduct?.reviewCount}
      />
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="mx-auto max-w-[1280px] px-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={breadcrumbItems}
          className="mb-4 py-3 text-xs text-[#666]"
        />

        {/* ============================================ */}
        {/* IDEALO STAGE - Main 3-column grid */}
        {/* ============================================ */}
        <div
          className={cn(
            "oopStage",
            "mb-6 grid gap-0",
            // Mobile: 1 column, 3 rows
            "grid-cols-1 grid-rows-[auto_auto_auto]",
            // Desktop (960px+): 3 columns
            "lg:grid-cols-[1fr_2fr_1fr] lg:grid-rows-[auto_auto]",
          )}
        >
          {/* ============================================ */}
          {/* COLUMN 1: Gallery Wrapper */}
          {/* ============================================ */}
          <div
            className={cn(
              "oopStage-wrapper",
              "min-w-0 flex-1 px-2.5 sm:px-[15px]",
              // Mobile: row 2
              "col-start-1 row-start-2",
              // Desktop: spans all rows
              "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:-row-end-1",
            )}
          >
            <div className="oopStage-gallery">
              {/* Main Image */}
              <div className="relative mx-auto aspect-square w-full max-w-[400px] bg-white">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#f5f5f5] text-[#999]">
                    <Package className="h-24 w-24 stroke-1" />
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-[50px] w-[60px] shrink-0 cursor-pointer border p-1 transition-all",
                      i === 1
                        ? "border-[#0066cc]"
                        : "border-[#e5e5e5] hover:border-[#0066cc]",
                    )}
                  >
                    {product.image && (
                      <div className="relative h-full w-full">
                        <Image
                          src={product.image}
                          alt={`${product.title} - view ${i}`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile Price CTA */}
              <div className="mt-4 rounded border border-[#e5e5e5] p-4 lg:hidden">
                <a
                  href="#offerList"
                  className="flex items-center justify-between"
                >
                  <p className="text-lg font-bold text-[#333]">
                    {formatCurrency(bestPrice, countryCode)}
                  </p>
                  <span className="text-sm font-semibold text-[#0066cc]">
                    {offers.length} Angebote vergleichen
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* COLUMN 2 ROW 1: Details Header (Title) */}
          {/* ============================================ */}
          <div
            className={cn(
              "oopStage-details-header",
              "min-w-0 flex-1 px-2.5 sm:px-[15px]",
              // Grid position
              "col-start-1 row-start-1",
              "lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2",
            )}
          >
            {/* Favorites */}
            <div className="mb-2 hidden justify-end lg:flex">
              <button
                className="rounded-full p-2 transition-colors hover:bg-[#f5f5f5]"
                aria-label="Auf Merkzettel speichern"
              >
                <Heart className="h-6 w-6 text-[#999] hover:text-[#e74c3c]" />
              </button>
            </div>

            {/* Title */}
            <h1
              id="oopStage-title"
              className="mb-2 text-xl leading-tight font-bold text-[#333] lg:text-2xl"
            >
              {product.title}
            </h1>

            {/* Mobile Rating */}
            <div className="mb-4 flex items-center gap-2 lg:hidden">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-4 w-4 fill-[#ff9900] text-[#ff9900]"
                  />
                ))}
              </div>
              <span className="text-sm text-[#0066cc]">(8)</span>
            </div>
          </div>

          {/* ============================================ */}
          {/* COLUMN 2 ROW 2+: Details (Meta Info + Product Info) */}
          {/* ============================================ */}
          <div
            className={cn(
              "oopStage-details",
              "w-full min-w-0 flex-1 lg:pl-6",
              // Mobile: row 3
              "col-start-1 row-start-3",
              // Desktop: column 2, row 2 to end
              "lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:-row-end-1 lg:justify-self-start",
            )}
          >
            {/* Meta Info Row */}
            <div className="oopStage-metaInfo mb-4 hidden flex-wrap items-center gap-4 lg:flex">
              {/* Ratings */}
              <a href="#reviews" className="group flex items-center gap-2">
                <span className="text-sm text-[#333]">8 Produktmeinungen:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-[#ff9900] text-[#ff9900]"
                    />
                  ))}
                </div>
                <span className="text-sm text-[#0066cc] group-hover:underline">
                  (8)
                </span>
              </a>

              {/* Test Reports */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#333]">3 Testberichte:</span>
                <span className="rounded bg-[#6eb400] px-2 py-0.5 text-sm font-semibold text-white">
                  Note ∅ 1,5
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="oopStage-productInfo mb-6">
              <div className="mb-4">
                <b className="text-sm text-[#333]">Produktübersicht:</b>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-sm text-[#666]">
                    Kapazität: {product.capacity} {product.capacityUnit}
                  </span>
                  <span className="text-sm text-[#999]">•</span>
                  <span className="text-sm text-[#666]">
                    Bauform: {product.formFactor}
                  </span>
                  {product.technology && (
                    <>
                      <span className="text-sm text-[#999]">•</span>
                      <span className="text-sm text-[#666]">
                        {product.technology}
                      </span>
                    </>
                  )}
                  <a
                    href="#datasheet"
                    className="text-sm font-semibold text-[#0066cc] hover:underline"
                  >
                    Produktdetails
                  </a>
                </div>
              </div>

              {/* Cross Links */}
              <div className="mb-4">
                <b className="text-sm text-[#333]">Ähnliche Produkte:</b>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/${product.category}`}
                    className="text-sm text-[#0066cc] hover:underline"
                  >
                    {category?.name}
                  </Link>
                  <Link
                    href={`/${product.category}?brand=${encodeURIComponent(product.brand)}`}
                    className="text-sm text-[#0066cc] hover:underline"
                  >
                    {product.brand} Produkte
                  </Link>
                </div>
              </div>

              {/* Condition Buttons */}
              <div id="context-buttons" className="mb-6 flex flex-wrap gap-3">
                {/* New */}
                <button className="flex items-center gap-3 rounded border-2 border-[#0066cc] bg-white px-4 py-3 transition-colors hover:bg-[#f5f9ff]">
                  <div className="text-left">
                    <div className="text-sm font-semibold text-[#333]">Neu</div>
                    <div className="text-sm text-[#666]">
                      ab{" "}
                      <strong className="text-[#333]">
                        {formatCurrency(bestPrice, countryCode)}
                      </strong>
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-[#0066cc]" />
                </button>

                {/* Used */}
                <button className="flex items-center gap-3 rounded border border-[#e5e5e5] bg-white px-4 py-3 transition-colors hover:border-[#0066cc]">
                  <div className="text-left">
                    <div className="text-sm font-semibold text-[#333]">
                      B-Ware & Gebraucht
                    </div>
                    <div className="text-sm text-[#666]">
                      ab <strong className="text-[#333]">N.A.</strong>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#999]" />
                </button>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* COLUMN 3: Price Chart */}
          {/* ============================================ */}
          <div
            className={cn(
              "oopStage-price-chart",
              "hidden lg:block",
              // Grid position: rightmost column, spans all rows
              "lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:-row-end-1",
              "px-0",
            )}
          >
            <div id="price-chart-wrapper" className="sticky top-4">
              <IdealoPriceChart history={product.priceHistory} />
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* MAIN WRAPPER - Offers + Sidebar Layout */}
        {/* ============================================ */}
        <div
          className={cn(
            "oop-mainWrapper",
            "flex flex-wrap [overflow-anchor:none]",
            "w-full",
          )}
        >
          {/* ============================================ */}
          {/* SIDEBAR - 25% on desktop, hidden on mobile/tablet */}
          {/* ============================================ */}
          <aside
            id="sidebar"
            className={cn(
              "oopMarginal",
              "hidden xl:block",
              "min-w-0 xl:w-1/4",
              "xl:pr-[15px]",
              "text-[14px] leading-[16px] text-[#2d2d2d]",
              "mb-[45px]",
              "order-1",
            )}
          >
            {/* Similar Products */}
            <section
              id="recommendedProducts"
              className="mb-0.5 rounded-md bg-[#d7e3ef] p-2.5"
            >
              <h2 className="oopMarginal-wrapperTitle mb-3 text-base font-extrabold text-[#2d2d2d]">
                Ähnliche Produkte
              </h2>
              <ul className="space-y-2">
                {similarProducts.slice(0, 5).map((p) => (
                  <li
                    key={p.slug}
                    className="oopMarginal-wrapperListItem flex cursor-pointer items-center gap-2 rounded p-1 transition-colors hover:bg-white/50"
                  >
                    <div className="relative h-12 w-12 shrink-0 bg-white">
                      {p.image && (
                        <Image
                          src={p.image}
                          alt={p.title}
                          fill
                          className="object-contain p-1"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/p/${p.slug}`}
                        className="block truncate text-[0.775rem] leading-[1.2] font-normal text-[#0771d0] hover:underline"
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs text-[#2d2d2d]">
                        ab {formatCurrency(p.prices[countryCode], countryCode)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          {/* ============================================ */}
          {/* DATASHEET - Product Details */}
          {/* ============================================ */}
          <div
            id="datasheet"
            className={cn(
              "datasheet",
              "order-3 w-full min-w-0",
              "scroll-mt-[15vh]",
              "mb-5",
            )}
          >
            <h2 className="datasheet-title mb-5 border-b border-[#b4b4b4] pb-4 text-lg font-bold sm:text-2xl lg:mb-8">
              Produktdetails
            </h2>
            <div className="datasheet-wrapper flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Product Image */}
              <div className="relative mx-auto h-[200px] w-[200px] shrink-0 sm:mx-0 sm:h-[240px] sm:w-[290px]">
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-contain"
                  />
                )}
              </div>

              {/* Specs Table */}
              <div className="flex-1">
                <SpecificationsTable product={product} />
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* OFFER LIST - Price Comparison */}
          {/* ============================================ */}
          <div
            id="offerList"
            className={cn(
              "productOffers",
              "w-full min-w-0 xl:w-3/4",
              "scroll-mt-[15vh]",
              "mb-11 xl:pl-[15px]",
              "order-2",
            )}
          >
            {/* Offer List Header */}
            <div
              className={cn(
                "productOffers-header",
                "flex min-h-[40px] flex-wrap items-center justify-between gap-4",
                "border border-b-0 border-[#b4b4b4]",
                "rounded-t-md bg-[#f0f0f0] p-3",
                "sm:flex-nowrap",
              )}
            >
              <h2 className="productOffers-headerTitle text-lg font-bold sm:text-xl">
                Preisvergleich
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#b4b4b4] bg-white accent-[#0771d0]"
                  />
                  <span className="text-[#2d2d2d]">Inkl. Versandkosten</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#b4b4b4] bg-white accent-[#0771d0]"
                  />
                  <span className="text-[#2d2d2d]">Sofort lieferbar</span>
                </label>
              </div>
            </div>

            {/* Offer List Container */}
            <div
              id="offer-list-with-pagination"
              className="rounded-b-md border border-[#b4b4b4] border-t-[#dcdcdc]"
            >
              {/* Column Headers - Desktop only (Shown at 960px+) */}
              <div className="productOffers-listHeadline hidden border-b border-[#dcdcdc] bg-white text-[11px] font-bold text-[#2d2d2d] min-[960px]:flex">
                <div className="w-[18%] min-w-0 px-[15px] py-2">
                  Angebotsbezeichnung
                </div>
                <div className="w-[14%] min-w-0 px-[15px] py-2">
                  Preis & Versand
                </div>
                <div className="w-[14%] min-w-0 px-[15px] py-2">
                  Zahlungsarten*
                </div>
                <div className="w-[16%] min-w-0 px-[15px] py-2 text-center">
                  Lieferung
                </div>
                <div className="w-[20%] min-w-0 px-[15px] py-2">
                  Shop & Shopbewertung
                </div>
                <div className="w-[18%] py-2"></div>
              </div>

              {/* Offer Rows */}
              <ul className="productOffers-list">
                {offers.map((offer, index) => (
                  <li
                    key={`${offer.source}-${index}`}
                    className={cn(
                      "productOffers-listItem",
                      "group flex flex-col border-b border-[#dcdcdc] bg-white p-3.5",
                      "text-xs leading-[1.4] text-[#2d2d2d]",
                      "hover:bg-[#fafafa]",
                      // Desktop Transition at 600px (37.5em)
                      "min-[600px]:flex-row min-[600px]:flex-wrap min-[600px]:gap-0 min-[600px]:px-0 min-[600px]:py-[15px]",
                    )}
                  >
                    {/* Mobile: Title Link (Full Width Block at Top) */}
                    <div className="mb-2 w-full min-[600px]:hidden">
                      <a
                        href={offer.affiliateLink}
                        target="_blank"
                        rel="noopener nofollow"
                        className="text-[12px] font-bold text-[#0771d0] underline decoration-[#dcdcdc] hover:no-underline"
                      >
                        {product.title}
                      </a>
                    </div>

                    {/* Desktop: Title Column (Visible from 600px) */}
                    <div
                      className={cn(
                        "productOffers-listItemTitleWrapper",
                        "hidden min-[600px]:block min-[600px]:w-full min-[600px]:min-w-0 min-[600px]:self-start min-[600px]:px-[15px] min-[600px]:pt-[7px] min-[840px]:w-[18%]",
                      )}
                    >
                      <a
                        href={offer.affiliateLink}
                        target="_blank"
                        rel="noopener nofollow"
                        className={cn(
                          "productOffers-listItemTitleInner",
                          "line-clamp-4 block max-h-[4.8em] overflow-hidden font-bold text-ellipsis text-[#0771d0] underline decoration-[#dcdcdc] transition-colors hover:no-underline",
                          "text-[11px] leading-normal min-[840px]:text-[12px]",
                        )}
                      >
                        {product.title}
                      </a>
                    </div>

                    {/* Mid Section for Mobile (Price + Shop + CTA side-by-side) */}
                    <div className="flex w-full items-center justify-between min-[600px]:contents">
                      {/* Price & Shipping Column */}
                      <div className="price-column relative z-10 w-auto min-w-0 p-0 min-[600px]:w-[18%] min-[600px]:shrink-0 min-[600px]:self-start min-[600px]:px-[15px] min-[840px]:w-[14%]">
                        <div className="flex flex-col">
                          <a
                            href={offer.affiliateLink}
                            target="_blank"
                            rel="noopener nofollow"
                            className={cn(
                              "productOffers-listItemOfferPrice",
                              "relative z-1 font-bold text-[#2d2d2d] no-underline min-[600px]:text-[20px] lg:text-2xl",
                              "cursor-pointer",
                            )}
                          >
                            {offer.displayPrice ||
                              formatCurrency(offer.price, countryCode)}
                          </a>
                          {index === 0 && (
                            <div className="amazon-prime__wrapper mt-[2px] min-[600px]:mt-[3px]">
                              <div className="best-total-price-box relative z-10 h-max max-w-full cursor-pointer rounded border border-[#f60] p-[4px_6px]">
                                <div className="productOffers-listItemOfferBestTotalPrice overflow-hidden text-[9px] font-bold text-ellipsis whitespace-nowrap text-[#f60] sm:text-[10px]">
                                  Günstigster Gesamtpreis
                                </div>
                                <div className="productOffers-listItemOfferShippingDetails relative z-1 mt-0.5 border-spacing-[0_4px] text-[9px] leading-[12px] text-[#2d2d2d] sm:text-[10px]">
                                  {offer.freeShipping
                                    ? `${offer.displayPrice || formatCurrency(offer.price, countryCode)} inkl. Versand`
                                    : "zzgl. Versand"}
                                </div>
                              </div>
                            </div>
                          )}
                          {index !== 0 && (
                            <div className="productOffers-listItemOfferShippingDetails mt-1 text-[11px] text-[#666]">
                              {offer.freeShipping
                                ? "inkl. Versand"
                                : "zzgl. Versand"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Shop & Rating Column (Mobile: middle) */}
                      <div
                        className={cn(
                          "productOffers-listItemOfferShopV2Block",
                          "flex flex-col items-center gap-1.5 min-[600px]:w-[24%] min-[600px]:flex-none min-[600px]:justify-center min-[600px]:px-[15px] min-[600px]:text-center min-[840px]:w-[20%]",
                        )}
                        data-offerlist-column="shop"
                      >
                        <div className="productOffers-listItemOfferShopV2 flex flex-col items-center min-[600px]:gap-2">
                          <a
                            href={offer.affiliateLink}
                            className="productOffers-listItemOfferShopV2LogoLink relative z-10 inline-block h-[22px] w-[60px] overflow-hidden rounded border border-[#eee] bg-[#f5f5f5] text-center min-[600px]:h-[30px] min-[600px]:w-[80px]"
                            target="_blank"
                            rel="noopener nofollow"
                          >
                            <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-[#333] min-[600px]:text-[10px]">
                              {offer.seller || "Shop"}
                            </div>
                          </a>

                          <div className="productOffers-listItemOfferShopV2RatingsContainer flex flex-col items-center">
                            <a
                              href="#"
                              className="productOffers-listItemOfferShopV2StarsLink hover:underline"
                            >
                              <div className="starAndRatingWrapper flex items-center gap-1 text-[#2d2d2d]">
                                <Star className="h-3 w-3 fill-[#96DC50] text-[#96DC50] min-[600px]:h-3.5 min-[600px]:w-3.5" />
                                <span className="text-[12px] font-bold">
                                  3,8
                                </span>
                              </div>
                            </a>
                          </div>
                        </div>
                        <button className="hidden text-[11px] text-[#2d2d2d] underline hover:no-underline min-[600px]:block">
                          Shop-Details
                        </button>
                      </div>

                      {/* Payment Methods - Hidden ONLY below 600px */}
                      <div className="payment-column hidden min-w-0 flex-col p-0 min-[600px]:flex min-[600px]:w-[18%] min-[600px]:shrink-0 min-[600px]:self-start min-[600px]:px-[15px] min-[600px]:pt-4 min-[840px]:w-[14%]">
                        <div className="flex flex-wrap gap-[-1px]">
                          {["Visa", "PayPal", "Rechnung"].map((method) => (
                            <div
                              key={method}
                              className={cn(
                                "productOffers-listItemOfferShippingDetailsRightItem",
                                "inline-block h-[17px] w-[52px] min-w-[52px] overflow-hidden text-ellipsis whitespace-nowrap",
                                "border border-[#e6e6e6] bg-white p-px text-center text-[0.5625rem] leading-[13px]",
                                "m-[0_-1px_-1px_0]",
                              )}
                            >
                              <span className="text-inherit">{method}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Column - Hidden ONLY below 600px */}
                      <div className="hidden min-w-0 shrink-0 min-[600px]:block min-[600px]:w-[18%] min-[600px]:self-center min-[600px]:px-[15px] min-[840px]:w-[16%]">
                        <ul
                          className="productOffers-listItemOfferDeliveryBlock list-none pl-[0.6em]"
                          style={
                            {
                              "--list-spacing": "0.8rem",
                              "--dot-size": "0.5em",
                            } as React.CSSProperties
                          }
                        >
                          <li className="relative mb-(--list-spacing) pl-(--list-spacing) leading-normal">
                            <svg
                              className="absolute top-[0.3em] left-0 h-(--dot-size) w-(--dot-size) fill-[#38bf84]"
                              viewBox="0 0 4 4"
                            >
                              <circle cx="2" cy="2" r="2" />
                            </svg>
                            <div className="productOffers-listItemOfferDeliveryStatus line-clamp-3 cursor-pointer overflow-hidden text-xs leading-[1.2] text-[#2d2d2d]">
                              <span className="productOffers-listItemOfferDeliveryStatusDates font-bold">
                                {offer.availability === "in_stock"
                                  ? "Auf Lager "
                                  : "2-5 Tage "}
                              </span>
                              <span className="productOffers-listItemOfferDeliveryStatusDatesTitle block font-normal">
                                Lieferung bis morgen
                              </span>
                            </div>
                          </li>
                          <li className="relative mb-(--list-spacing) pl-(--list-spacing)">
                            <div className="productOffers-listItemOfferDeliveryProviderWrapper mb-[5px] text-[0px]">
                              <div className="productOffers-listItemOfferDeliveryProvider mt-0 -mr-px mb-0 ml-0 inline-block border border-[#e6e6e6] bg-white">
                                <span className="productOffers-listItemOfferGreyBadge inline-block cursor-pointer rounded-[2px] bg-[#f5f5f5] px-[6px] py-[0.5px] text-[9px] whitespace-nowrap">
                                  DHL
                                </span>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </div>

                      {/* CTA Button (Stay on right for mobile, far right for desktop) */}
                      <div className="flex min-w-0 shrink-0 justify-center min-[600px]:w-[22%] min-[600px]:px-[15px] min-[840px]:w-[18%]">
                        <a
                          href={offer.affiliateLink}
                          target="_blank"
                          rel="noopener nofollow"
                          className={cn(
                            "inline-flex items-center justify-center",
                            "rounded-[2px] bg-[#38bf84] px-[20px] font-bold text-white transition-colors hover:bg-[#2fa372]",
                            "h-[30px] max-h-[30px] w-full text-[13px] min-[600px]:w-[110px] min-[600px]:px-[10px] min-[600px]:text-[13px]",
                          )}
                        >
                          Zum Shop
                        </a>
                      </div>
                    </div>

                    {/* Mobile Card Footer (Delivery Info + Details link) */}
                    <div className="mt-3 flex w-full items-center gap-4 border-t border-[#e5e5e5] pt-3 min-[600px]:hidden">
                      <button className="text-[12px] font-bold text-[#2d2d2d] underline decoration-[#dcdcdc] hover:no-underline">
                        Details
                      </button>
                      <div className="h-4 w-px bg-[#e5e5e5]" />
                      <div className="flex items-center gap-1.5 text-[12px] text-[#2d2d2d]">
                        <svg
                          className={cn(
                            "h-1.5 w-1.5 fill-current",
                            offer.availability === "in_stock"
                              ? "text-[#38BF84]"
                              : "text-[#FEC002]",
                          )}
                          viewBox="0 0 4 4"
                        >
                          <circle cx="2" cy="2" r="2" />
                        </svg>
                        <span className="font-medium">
                          {offer.availability === "in_stock"
                            ? "Auf Lager"
                            : "2-5 Tage"}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Load More Button */}
              {offers.length > 5 && (
                <div className="flex justify-center border-t border-[#e5e5e5] bg-white p-4">
                  <button className="text-sm font-semibold text-[#0066cc] hover:underline">
                    Weitere Angebote anzeigen
                  </button>
                </div>
              )}
            </div>

            {/* Footer Note */}
            <p className="mt-2 text-[10px] text-[#666]">
              * Alle Preise inkl. MwSt. Angaben ohne Gewähr.
              {product.pricesLastUpdated?.[countryCode] && (
                <span className="mt-1 block">
                  Zuletzt aktualisiert:{" "}
                  {new Date(
                    product.pricesLastUpdated[countryCode]!,
                  ).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
        {/* ============================================ */}
        {/* RELATED PRODUCTS CAROUSEL */}
        {/* ============================================ */}
        <div className="mt-8 mb-12">
          <IdealoProductCarousel
            title="Das könnte dich auch interessieren"
            products={similarProducts.map((p) => ({
              title: p.title,
              price: p.prices[countryCode] || 0,
              slug: p.slug,
              image: p.image,
              rating: p.rating,
              ratingCount: p.reviewCount,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
