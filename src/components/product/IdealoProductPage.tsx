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

import React from "react";
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
import { PaymentMethodIcon } from "@/components/ui/PaymentMethodIcon";

interface IdealoProductPageProps {
  product: Product;
  countryCode: CountryCode;
  unifiedProduct?: UnifiedProduct | null;
  similarProducts?: Product[];
}

export async function IdealoProductPage({
  product,
  countryCode,
  unifiedProduct,
  similarProducts = [],
}: IdealoProductPageProps) {
  const countryConfig = getCountryByCode(countryCode);
  const category = getCategoryBySlug(product.category);
  const price = product.prices[countryCode];

  // Extract short title/model from specifications
  const modelName = product.specifications?.Model as string | undefined;
  const shortTitle =
    modelName ||
    product.title.split(/[\(\-,]|Processor/i)[0].trim() ||
    product.title;

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

  // Helper for short title in H1
  const displayTitle = shortTitle;

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
        rating={unifiedProduct?.rating ?? product.rating}
        reviewCount={unifiedProduct?.reviewCount ?? product.reviewCount}
      />
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="mx-auto max-w-[1280px] px-4">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-[10px] py-0 pt-3" />

        <div className="text-[14px]">
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
                "min-w-0 flex-1 px-2.5 sm:px-0",
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

                {/* Thumbnail Strip - Removed for single image */}
                {/* To re-enable when multiple images are available, check product.images?.length > 1 */}

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
                "min-w-0 flex-1 px-2.5 sm:px-[15px] lg:pl-[25px]",
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
                className="mb-1 text-[20px] leading-tight font-bold text-[#2d2d2d]"
              >
                {displayTitle}
              </h1>

              {/* Desktop Rating (Moved up) */}
              <div className="oopStage-metaInfo mb-4 hidden flex-wrap items-center gap-4 lg:flex">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#2d2d2d]">
                    Produktbewertung:
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const ratingValue =
                        unifiedProduct?.rating ?? product.rating ?? 4.5;
                      // Calculate fill percentage for each star
                      const fillPercent = Math.max(
                        0,
                        Math.min(100, (ratingValue - (s - 1)) * 100),
                      );

                      return (
                        <div key={s} className="relative h-3.5 w-3.5">
                          {/* Empty star background */}
                          <Star className="absolute inset-0 h-3.5 w-3.5 text-[#e5e5e5]" />
                          {/* Partially filled star foreground */}
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${fillPercent}%` }}
                          >
                            <Star className="h-3.5 w-3.5 fill-black text-black" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[12px] text-[#2d2d2d]">
                    ({unifiedProduct?.reviewCount ?? product.reviewCount ?? 0})
                  </span>
                </div>
              </div>

              {/* Mobile Rating */}
              <div className="mb-4 flex items-center gap-2 lg:hidden">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const ratingValue =
                      unifiedProduct?.rating ?? product.rating ?? 4.5;
                    const fillPercent = Math.max(
                      0,
                      Math.min(100, (ratingValue - (s - 1)) * 100),
                    );
                    return (
                      <div key={s} className="relative h-4 w-4">
                        <Star className="absolute inset-0 h-4 w-4 text-[#e5e5e5]" />
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${fillPercent}%` }}
                        >
                          <Star className="h-4 w-4 fill-black text-black" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <span className="text-sm text-[#2d2d2d]">
                  ({unifiedProduct?.reviewCount ?? product.reviewCount ?? 0})
                </span>
              </div>
            </div>

            {/* ============================================ */}
            {/* COLUMN 2 ROW 2+: Details (Meta Info + Product Info) */}
            {/* ============================================ */}
            <div
              className={cn(
                "oopStage-details",
                "w-full min-w-0 flex-1 lg:pl-[25px]",
                // Mobile: row 3
                "col-start-1 row-start-3",
                // Desktop: column 2, row 2 to end
                "lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:-row-end-1 lg:justify-self-start",
              )}
            >
              {/* Product Info (Product Overview) */}
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
                        {i < 4 &&
                          i <
                            Object.keys(product.specifications || {}).length -
                              1 && (
                            <span className="mx-0.5 text-[#2d2d2d]">·</span>
                          )}
                      </React.Fragment>
                    ))}
                  {(!product.specifications ||
                    Object.keys(product.specifications).length === 0) && (
                    <>
                      <span>{product.brand}</span>
                      <span className="mx-0.5 text-[#2d2d2d]">·</span>
                      <span>
                        {product.capacity} {product.capacityUnit}
                      </span>
                      <span className="mx-0.5 text-[#2d2d2d]">·</span>
                      <span>{product.formFactor}</span>
                    </>
                  )}
                  <a
                    href="#datasheet"
                    className="ml-1 text-[#0066cc] hover:no-underline"
                  >
                    Produktdetails
                  </a>
                </div>

                {/* Similar Products Breadcrumb-style Links */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-[#2d2d2d]">
                  <b className="mr-0.5 font-bold">Ähnliche Produkte:</b>
                  <Link
                    href={`/${product.category}`}
                    className="text-[#2d2d2d]! underline! decoration-[#2d2d2d] underline-offset-2 hover:text-[#f97316]! hover:decoration-[#f97316]!"
                  >
                    {category?.name}
                  </Link>
                  <span className="mx-0.5">·</span>
                  <Link
                    href={`/${product.category}?brand=${encodeURIComponent(product.brand)}`}
                    className="text-[#2d2d2d]! underline! decoration-[#2d2d2d] underline-offset-2 hover:text-[#f97316]! hover:decoration-[#f97316]!"
                  >
                    {product.brand} Produkte
                  </Link>
                </div>

                {/* Condition / Deals Buttons */}
                <div
                  id="context-buttons"
                  className="mt-6 flex flex-wrap gap-2.5"
                >
                  {/* New */}
                  <button className="flex min-w-[140px] flex-col items-center justify-center rounded-[2px] border border-[#0066cc] bg-[#f5f9ff] px-4 py-2 transition-colors hover:bg-[#e6f0ff]">
                    <div className="text-[13px] font-bold text-[#2d2d2d]">
                      Neu ab
                    </div>
                    <div className="text-[15px] font-extrabold text-[#2d2d2d]">
                      {formatCurrency(bestPrice, countryCode)}
                    </div>
                  </button>

                  {/* Used */}
                  {offers.some((o) => o.condition && o.condition !== "new") && (
                    <Link
                      href="#offerList"
                      className="flex min-w-[140px] flex-col items-center justify-center rounded-[2px] border border-[#dcdcdc] bg-white px-4 py-2 transition-colors hover:border-[#b4b4b4]"
                    >
                      <div className="text-[13px] font-bold text-[#2d2d2d]">
                        Gebraucht ab
                      </div>
                      <div className="text-[15px] font-extrabold text-[#2d2d2d]">
                        {formatCurrency(
                          Math.min(
                            ...offers
                              .filter((o) => o.condition !== "new")
                              .map((o) => o.price),
                          ),
                          countryCode,
                        )}
                      </div>
                    </Link>
                  )}
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
                className="mb-0.5 rounded-md bg-[#f0f4f8] p-4"
              >
                <h2 className="oopMarginal-wrapperTitle mb-4 text-[16px] font-bold text-[#2d2d2d]">
                  Ähnliche Produkte
                </h2>
                <ul className="space-y-3">
                  {similarProducts.slice(0, 5).map((p) => (
                    <li
                      key={p.slug}
                      className="oopMarginal-wrapperListItem flex cursor-pointer items-start gap-3 rounded transition-colors"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-[#e5e5e5] bg-white">
                        {p.image && (
                          <Image
                            src={p.image}
                            alt={p.title}
                            fill
                            className="object-contain p-1.5"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/p/${p.slug}`}
                          className="line-clamp-2 block text-[12px] leading-[1.3] font-bold text-[#2d2d2d]! underline! decoration-[#2d2d2d] underline-offset-1 hover:text-[#f97316]! hover:decoration-[#f97316]!"
                        >
                          {p.title}
                        </Link>
                        <div className="mt-1 text-[12px] font-bold text-[#2d2d2d]">
                          ab{" "}
                          {formatCurrency(p.prices[countryCode], countryCode)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>

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
                          className="text-[12px] font-bold text-[#2d2d2d] underline decoration-[#dcdcdc] hover:no-underline"
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
                            "line-clamp-4 block max-h-[4.8em] overflow-hidden font-bold text-ellipsis text-[#2d2d2d] underline decoration-[#dcdcdc] transition-colors hover:no-underline",
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
                                      : offer.shippingCost !== undefined &&
                                          offer.shippingCost !== null
                                        ? `+ ${formatCurrency(offer.shippingCost, countryCode)} Versand`
                                        : "zzgl. Versand"}
                                  </div>
                                </div>
                              </div>
                            )}
                            {index !== 0 && (
                              <div className="productOffers-listItemOfferShippingDetails mt-1 text-[11px] text-[#666]">
                                {offer.freeShipping
                                  ? "inkl. Versand"
                                  : offer.shippingCost !== undefined &&
                                      offer.shippingCost !== null
                                    ? `+ ${formatCurrency(offer.shippingCost, countryCode)} Versand`
                                    : "zzgl. Versand"}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment Methods Column */}
                        <div className="payment-column hidden min-w-0 flex-col p-0 min-[600px]:flex min-[600px]:w-[18%] min-[600px]:shrink-0 min-[600px]:self-start min-[600px]:px-[15px] min-[600px]:pt-4 min-[840px]:w-[14%]">
                          <div className="flex flex-wrap gap-[2px]">
                            {(
                              offer.paymentMethods || [
                                "Visa",
                                "PayPal",
                                "Rechnung",
                              ]
                            ).map((method) => (
                              <PaymentMethodIcon key={method} method={method} />
                            ))}
                          </div>
                        </div>

                        {/* Delivery Column */}
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
                                  {offer.deliveryTime ||
                                    (offer.availability === "in_stock"
                                      ? "Lieferung in 1-2 Werktagen"
                                      : "Versandfertig in 2-4 Tagen")}
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

                        {/* Shop & Rating Column */}
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
                                  <Star
                                    className="h-3 w-3 min-[600px]:h-3.5 min-[600px]:w-3.5"
                                    style={{
                                      fill:
                                        (offer.merchantRating ?? 4.5) >= 4.0
                                          ? "#38BF84"
                                          : (offer.merchantRating ?? 4.5) >= 2.8
                                            ? "#FEC002"
                                            : "#FF6600",
                                      color:
                                        (offer.merchantRating ?? 4.5) >= 4.0
                                          ? "#38BF84"
                                          : (offer.merchantRating ?? 4.5) >= 2.8
                                            ? "#FEC002"
                                            : "#FF6600",
                                    }}
                                  />
                                  <span className="text-[12px] font-bold">
                                    {offer.merchantRating?.toFixed(1) || "4.5"}
                                  </span>
                                </div>
                              </a>
                            </div>
                          </div>
                          <button className="hidden text-[11px] text-[#2d2d2d] underline hover:no-underline min-[600px]:block">
                            Shop-Details
                          </button>
                        </div>

                        {/* CTA Button */}
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

            {/* ============================================ */}
            {/* DATASHEET - Product Details */}
            {/* ============================================ */}
            <div
              id="datasheet"
              className={cn(
                "datasheet",
                "order-3 w-full min-w-0",
                "scroll-mt-[15vh]",
                "mb-12",
              )}
            >
              <h2 className="datasheet-title mb-8 border-b border-[#ebebeb] pb-4 text-[20px] font-bold text-[#2d2d2d] sm:text-[24px]">
                Produktdetails
              </h2>
              <div className="datasheet-wrapper flex flex-col gap-8 sm:flex-row sm:items-start">
                {/* Product Image */}
                <div className="datasheet-imageWrapper relative mx-auto h-[200px] w-full shrink-0 px-4 sm:mx-0 sm:h-[300px] sm:w-[300px] lg:w-[350px]">
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
                <div className="datasheet-specs flex-1">
                  <SpecificationsTable product={product} />
                </div>
              </div>
            </div>
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
