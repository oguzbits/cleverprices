import { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { IdealoProductPage } from "@/components/product/IdealoProductPage";
import { DEFAULT_COUNTRY, getCountryByCode } from "@/lib/countries";
import { getPDPRenderData } from "@/lib/server/cached-products";
import { BRAND_NAME, CACHE_VERSION } from "@/lib/site-config";
import { isProductHighQuality } from "@/lib/utils/quality";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Static params generation for ISR / Build-time safety
 */
export async function generateStaticParams() {
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";
  if (isBuild) return [{ slug: "build-time-placeholder" }];
  return [];
}

/**
 * Metadata Generation for PDP
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug === "[slug]") return {};

  // Build-time safety: Skip data fetch during static generation to avoid blocking-route errors
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";
  if (isBuild) return {};

  const renderData = await getPDPRenderData(slug, DEFAULT_COUNTRY);

  if (!renderData) return {};

  if ("redirect" in renderData) {
    // metadata redirects are handled by the page, but we return an empty object to avoid 500
    return {};
  }

  const { product, category, isParentView } = renderData;
  const countryConfig = getCountryByCode(DEFAULT_COUNTRY);
  const displayTitle = isParentView
    ? product.modelTitle || product.title
    : product.title;
  const price = product.prices[DEFAULT_COUNTRY];

  return {
    title: `${displayTitle} | Preisvergleich & Test | ${BRAND_NAME}`,
    description: `${displayTitle} im Preisvergleich. Aktueller Bestpreis: ${price?.toFixed(2)}€ (${countryConfig?.currency || "EUR"}). Jetzt Top-Hardware Angebote vergleichen und sparen bei ${BRAND_NAME}.`,
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: {
      title: `${displayTitle} | ${BRAND_NAME}`,
      description: `Top Angebote für ${displayTitle} vergleichen.`,
      images: product.image ? [product.image] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description: `Hardware Preisvergleich für ${displayTitle}`,
      images: product.image ? [product.image] : [],
    },
  };
}

/**
 * Product Detail Page (PDP)
 *
 * "Sure-Way" Fix implementation:
 * 1. Minimal logic in the page component.
 * 2. Rely on getPDPRenderData for all data assembly.
 * 3. Explicitly handle the "redirect" and "notFound" cases using standard Next.js functions.
 */
export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const countryCode = DEFAULT_COUNTRY;

  // 1. Sanity check for build-time artifacts
  if (!slug || slug === "[slug]" || slug === "build-time-placeholder") {
    return <div className="hidden" aria-hidden="true" />;
  }

  // 2. Atomic Data Fetch
  const data = await getPDPRenderData(slug, countryCode);

  // 3. Handle Control Flow (Redirects / 404)
  if (!data) {
    notFound();
  }

  if ("redirect" in data) {
    if (data.isPermanent) permanentRedirect(data.redirect);
    else redirect(data.redirect);
  }

  // 4. Quality Check
  const { product, isParentView } = data;
  const isQualityEnough = isProductHighQuality(product, {
    checkPrice: true,
    countryCode,
    isParentView,
  });

  if (!isQualityEnough) {
    notFound();
  }

  // 5. Final Render
  return (
    <>
      <div className="hidden" data-v={CACHE_VERSION} aria-hidden="true" />
      <IdealoProductPage
        product={product}
        variants={data.variants}
        category={data.category as any}
        countryCode={countryCode}
        searchParamsPromise={searchParams}
        isParentView={isParentView}
        canonicalId={data.canonicalId}
        similarSidebar={data.similarSidebar}
        similarCarousel={data.similarCarousel}
      />
    </>
  );
}
