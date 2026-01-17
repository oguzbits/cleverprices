/**
 * Idealo Product Stage
 *
 * Faithful recreation of Idealo's product page layout.
 */

import { Breadcrumbs } from "@/components/breadcrumbs";
import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import {
  BreadcrumbSchema,
  ProductSchema,
} from "@/components/seo/ProductSchema";
import { LegalPrice } from "@/components/ui/LegalPrice";
import {
  getCategoryBySlug,
  getCategoryPath,
  type CategorySlug,
} from "@/lib/categories";
import { type CountryCode } from "@/lib/countries";
import type { UnifiedProduct } from "@/lib/data-sources";
import { Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import { formatDisplayTitle } from "@/lib/utils/formatting";
import { Package, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { IdealoPriceChart } from "./IdealoPriceChart";
import {
  IdealoLivePrice,
  IdealoLivePriceSkeleton,
  IdealoProductOffers,
  IdealoProductOffersSkeleton,
} from "./IdealoProductOffers";
import { SpecificationsTable } from "./SpecificationsTable";

interface IdealoProductPageProps {
  product: Product;
  countryCode: CountryCode;
  unifiedProductPromise: Promise<UnifiedProduct | null>;
  similarProducts?: Product[];
}

export function IdealoProductPage({
  product,
  countryCode,
  unifiedProductPromise,
  similarProducts = [],
}: IdealoProductPageProps) {
  const category = getCategoryBySlug(product.category);

  // Use centralized title splitting logic
  const shortTitle = formatDisplayTitle(
    product.title,
    product.specifications?.Model as string,
  );

  const hasPriceHistory =
    product.priceHistory && product.priceHistory.length > 0;

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
    <div className="min-h-screen bg-white">
      <ProductSchema
        product={product}
        countryCode={countryCode}
        rating={product.rating ?? 4.5}
        reviewCount={product.reviewCount ?? 0}
      />
      <BreadcrumbSchema items={breadcrumbItems} />

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

                {/* Mobile Price CTA - Now Live/Skeleton */}
                <div className="mt-4 rounded border border-[#e5e5e5] p-4 lg:hidden">
                  <a
                    href="#offerList"
                    className="flex items-center justify-between"
                  >
                    <Suspense
                      fallback={
                        <IdealoLivePriceSkeleton className="h-6 w-20" />
                      }
                    >
                      <IdealoLivePrice
                        product={product}
                        countryCode={countryCode}
                        unifiedProductPromise={unifiedProductPromise}
                        className="text-lg font-extrabold text-[#2d2d2d]"
                      />
                    </Suspense>
                    <span className="text-sm font-semibold text-[#0066cc]">
                      Zum Preisvergleich
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Title & Rating */}
            <div className="col-start-1 row-start-1 min-w-0 flex-1 px-2.5 sm:px-[15px] lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:pl-[25px]">
              <h1
                id="oopStage-title"
                className="mb-1 text-[20px] leading-tight font-bold text-[#2d2d2d]"
              >
                {displayTitle}
              </h1>
              <div className="oopStage-metaInfo mb-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="relative h-3.5 w-3.5">
                        <Star className="absolute inset-0 h-3.5 w-3.5 text-[#e5e5e5]" />
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            width: `${Math.max(0, Math.min(100, ((product.rating ?? 4.5) - (s - 1)) * 100))}%`,
                          }}
                        >
                          <Star className="h-3.5 w-3.5 fill-black text-black" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="text-[12px] text-[#2d2d2d]">
                    ({product.reviewCount || 0})
                  </span>
                </div>
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
                          <span className="mx-0.5 text-[#2d2d2d]">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  <a
                    href="#datasheet"
                    className="ml-1 text-[#0066cc] hover:no-underline"
                  >
                    Produktdetails
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <button className="flex min-w-[140px] flex-col items-center justify-center rounded-[2px] border border-[#0066cc] bg-[#f5f9ff] px-4 py-2 hover:bg-[#e6f0ff]">
                    <div className="text-[13px] font-bold text-[#2d2d2d]">
                      Neu ab
                    </div>
                    <div className="text-[15px] font-extrabold text-[#2d2d2d]">
                      <Suspense
                        fallback={
                          <IdealoLivePriceSkeleton className="h-5 w-16" />
                        }
                      >
                        <IdealoLivePrice
                          product={product}
                          countryCode={countryCode}
                          unifiedProductPromise={unifiedProductPromise}
                        />
                      </Suspense>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Price Chart Column */}
            <div className="hidden px-0 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:-row-end-1 lg:block">
              {hasPriceHistory && (
                <div id="price-chart-wrapper" className="sticky top-4">
                  <IdealoPriceChart history={product.priceHistory!} />
                </div>
              )}
            </div>
          </div>

          <div className="oop-mainWrapper flex w-full flex-wrap">
            <aside
              id="sidebar"
              className="order-1 mb-[45px] hidden min-w-0 text-[14px] leading-[16px] text-[#2d2d2d] xl:block xl:w-1/4 xl:pr-[15px]"
            >
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
                      className="flex cursor-pointer items-start gap-3 rounded bg-white p-2 transition-colors hover:shadow-sm"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-white">
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
                          className="line-clamp-2 block text-[12px] font-bold text-[#2d2d2d]! underline! hover:text-[#f97316]!"
                        >
                          {formatDisplayTitle(p.title)}
                        </Link>
                        <div className="mt-1 text-[12px] font-bold! text-[#2d2d2d]">
                          <LegalPrice price={p.prices[countryCode]} showAb />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>

            {/* Streaming Offers Section */}
            <Suspense fallback={<IdealoProductOffersSkeleton />}>
              <IdealoProductOffers
                product={product}
                countryCode={countryCode}
                unifiedProductPromise={unifiedProductPromise}
              />
            </Suspense>
          </div>

          {/* Specifications Table (Bottom) */}
          <div id="datasheet" className="scroll-mt-[10vh]">
            <SpecificationsTable product={product} />
          </div>

          {/* Similar Products Carousel */}
          <div className="-mx-4 mt-12 bg-[#f0f4f8] px-4 py-8">
            <div className="mx-auto max-w-[1280px]">
              <h2 className="mb-6 text-xl font-bold text-[#2d2d2d]">
                Auch interessant
              </h2>
              <IdealoProductCarousel
                products={similarProducts.map((p) => ({
                  ...p,
                  price: p.prices[countryCode],
                }))}
                countryCode={countryCode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
