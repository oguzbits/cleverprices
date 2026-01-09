import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAffiliateRedirectPath } from "@/lib/affiliate-utils";
import {
  getCategoryBySlug,
  getCategoryPath,
  type CategorySlug,
} from "@/lib/categories";
import { getCountryByCode, type CountryCode } from "@/lib/countries";
import type { ProductOffer, UnifiedProduct } from "@/lib/data-sources";
import { Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  Info,
  Package,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  BreadcrumbSchema,
  ProductSchema,
} from "@/components/seo/ProductSchema";
import { getSimilarProducts } from "@/lib/product-registry";
import { OfferComparisonTable } from "./OfferComparisonTable";
import { SimilarProducts } from "./SimilarProducts";
import { SpecificationsTable } from "./SpecificationsTable";

interface ProductDetailViewProps {
  product: Product;
  countryCode: CountryCode;
  unifiedProduct?: UnifiedProduct | null;
}

export async function ProductDetailView({
  product,
  countryCode,
  unifiedProduct,
}: ProductDetailViewProps) {
  const countryConfig = getCountryByCode(countryCode);
  const category = getCategoryBySlug(product.category);

  // Get similar products
  const similarProducts = await getSimilarProducts(product, 4, countryCode);

  // Get price for current country
  const price = product.prices[countryCode];

  // Format currency helper
  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "N.A.";
    return new Intl.NumberFormat(countryConfig?.locale || "de-DE", {
      style: "currency",
      currency: countryConfig?.currency || "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

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

  const pricePerUnit =
    product.pricePerUnit ||
    (price && product.normalizedCapacity
      ? price / product.normalizedCapacity
      : null);
  const unitLabel = product.capacityUnit === "W" ? "W" : product.capacityUnit;

  // Get offers
  const offers: ProductOffer[] = unifiedProduct?.offers || [];

  if (offers.length === 0 && price) {
    offers.push({
      source: "amazon" as const,
      price,
      currency: countryConfig?.currency || "EUR",
      displayPrice: formatCurrency(price),
      affiliateLink: getAffiliateRedirectPath(product.slug),
      condition: product.condition.toLowerCase() as "new" | "renewed" | "used",
      availability: "in_stock" as const,
      freeShipping: true,
      seller: "Amazon",
      country: countryCode,
    });
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ProductSchema
        product={product}
        countryCode={countryCode}
        rating={unifiedProduct?.rating}
        reviewCount={unifiedProduct?.reviewCount}
      />
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="mx-auto max-w-[1200px] px-4 py-4 md:py-6">
        {/* Breadcrumbs - Now above the title container */}
        <div className="mb-4">
          <Breadcrumbs
            items={breadcrumbItems}
            className="mb-0 text-[11px] font-medium text-zinc-400"
          />
        </div>

        {/* Top Product Hero Block */}
        <div className="mb-6 rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Gallery Column: Vertical Thumbnails + Main Image */}
            <div className="flex gap-4 lg:col-span-6">
              {/* Vertical Thumbnails (Extreme Left) */}
              <div className="flex shrink-0 flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 w-14 cursor-pointer rounded-sm border border-zinc-100 p-1 transition-colors hover:border-[#f97316]"
                  >
                    {product.image && (
                      <div className="relative h-full w-full">
                        <Image
                          src={product.image}
                          alt={`${product.title} - view ${i}`}
                          fill
                          className="object-contain opacity-60 hover:opacity-100"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Main Image */}
              <div className="relative aspect-square w-full cursor-zoom-in bg-white p-4">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 35vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-zinc-50 text-zinc-300">
                    <Package className="h-24 w-24 stroke-1" />
                  </div>
                )}
              </div>
            </div>

            {/* Product Meta & CTA Column */}
            <div className="flex flex-col lg:col-span-6">
              <div className="mb-6">
                <h1 className="mb-2 text-2xl leading-tight font-black tracking-tight text-zinc-900 md:text-3xl">
                  {product.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                  <span className="font-bold tracking-wider text-zinc-400 uppercase">
                    {product.brand}
                  </span>

                  <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="h-3.5 w-3.5 fill-[#ff6000] text-[#ff6000]"
                        />
                      ))}
                    </div>
                    <span className="font-bold text-zinc-900">4.8</span>
                    <span className="cursor-pointer text-blue-600 hover:underline">
                      (128 Bewertungen)
                    </span>
                  </div>
                </div>
              </div>

              {/* Highlights & Best Price Row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-11">
                {/* Specs Highlights */}
                <div className="md:col-span-6">
                  <h3 className="mb-3 text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                    Produkttests & Merkmale
                  </h3>
                  <div className="space-y-4">
                    {/* Expert Evaluation Badge Placeholder */}
                    <div className="flex items-center gap-3 rounded-sm bg-zinc-50 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#ff6000] font-black text-white">
                        1.5
                      </div>
                      <div className="text-[12px] leading-tight">
                        <p className="line-clamp-1 font-bold text-zinc-900">
                          SEHR GUT
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          ∅ 3 Testberichte
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-[13px] text-zinc-600">
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          Kapazität:{" "}
                          <b className="text-zinc-900">
                            {product.capacity} {product.capacityUnit}
                          </b>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          Bauform:{" "}
                          <b className="text-zinc-900">{product.formFactor}</b>
                        </span>
                      </li>
                      {product.technology && (
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>
                            Technik:{" "}
                            <b className="text-zinc-900">
                              {product.technology}
                            </b>
                          </span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="cursor-pointer font-bold text-blue-600 hover:underline">
                          + weitere Details
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Best Offer Block (Sticky-ish in Desktop Idealo) */}
                <div className="md:col-span-5">
                  <div className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-sm border border-[#c8e6c9] bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#2e7d32]">
                        BESTER PREIS
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f97316]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
                        Lagernd
                      </div>
                    </div>

                    <div className="mb-1 flex items-baseline gap-1">
                      <span className="text-[13px] font-bold tracking-tighter text-zinc-400 uppercase">
                        ab
                      </span>
                      <span className="text-3xl leading-none font-black tracking-tighter text-zinc-900">
                        {formatCurrency(offers[0]?.price || price)}
                      </span>
                    </div>

                    {pricePerUnit && (
                      <p className="mb-5 text-[11px] font-bold text-zinc-400">
                        {formatCurrency(pricePerUnit)} / {unitLabel}
                      </p>
                    )}

                    <a
                      href={getAffiliateRedirectPath(product.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block no-underline"
                    >
                      <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-[#22c55e] py-3 text-lg font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-[#16a34a] active:scale-[0.99]">
                        Zum Shop
                        <ChevronRight className="h-5 w-5 stroke-3" />
                      </button>
                    </a>

                    <div className="mt-4 flex flex-col gap-1.5 border-t border-zinc-100 pt-3">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Versand:</span>
                        <span className="font-bold text-zinc-900">Gratis</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Trend Widget Area */}
        <div className="mb-6 rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              Preisentwicklung
              <Info className="h-3.5 w-3.5 text-zinc-400" />
            </h2>
            <div className="flex gap-1">
              {["3M", "6M", "1J"].map((period) => (
                <button
                  key={period}
                  className={cn(
                    "rounded-sm border border-zinc-200 px-3 py-1 text-[11px] font-bold transition-colors",
                    period === "3M"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "bg-white text-zinc-600 hover:bg-zinc-50",
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-40 w-full overflow-hidden rounded-sm bg-zinc-50">
            {/* Fancy Placeholder UI for Chart */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <svg
                className="h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,80 Q20,60 40,70 T80,40 T100,50"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[12px] font-bold text-zinc-400">
                Preisverlauf Laden...
              </span>
              <button className="mt-2 rounded-sm border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100">
                Preiswecker stellen
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table Section */}
        <div
          id="offers"
          className="mb-8 overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
            <h2 className="flex items-center gap-2 text-sm font-black tracking-wide text-zinc-900 uppercase">
              Angebote{" "}
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                {offers.length}
              </span>
            </h2>
            <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400">
              <span className="flex items-center gap-1.5 uppercase">
                <Truck className="h-3.5 w-3.5" /> Preis inkl. Versand
              </span>
            </div>
          </div>
          <OfferComparisonTable
            offers={offers}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Specs Table */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black tracking-wide text-zinc-900 uppercase">
                Produktdaten & Details
              </h2>
              <div className="mx-6 flex h-px flex-1 bg-zinc-100 lg:mx-8" />
            </div>
            <div className="rounded-sm border border-zinc-200 bg-white shadow-sm">
              <SpecificationsTable product={product} />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Similar Products */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-black tracking-wide text-zinc-900 uppercase">
                  Ähnliche Produkte
                </h2>
                <Link
                  href={`/${product.category}`}
                  className="text-[11px] font-black tracking-wider text-[#f97316] uppercase hover:underline"
                >
                  Alle ›
                </Link>
              </div>
              <div className="divide-y divide-zinc-100 rounded-sm border border-zinc-200 bg-white shadow-sm">
                {similarProducts.slice(0, 3).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/p/${p.slug}`}
                    className="group flex items-center gap-4 p-4 no-underline transition-colors hover:bg-zinc-50"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-zinc-100 bg-white p-1 shadow-sm">
                      <Image
                        src={p.image || ""}
                        alt={p.title}
                        width={56}
                        height={56}
                        className="h-full w-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="line-clamp-2 text-[12px] leading-tight font-bold text-zinc-800 transition-colors group-hover:text-[#f97316]">
                        {p.title}
                      </h4>
                      <p className="mt-1 text-[13px] font-black tracking-tighter text-zinc-900">
                        {formatCurrency(p.prices[countryCode])}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Guide/Trust Area Placeholder */}
            <div className="rounded-sm border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center">
              <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
              <h3 className="text-[12px] font-bold text-zinc-500 uppercase">
                Käuferschutz & Sicherheit
              </h3>
              <p className="mt-1 text-[11px] text-zinc-400">
                Preise inkl. MwSt. Alle Angaben ohne Gewähr.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
