import { IdealoProductPage } from "@/components/product/IdealoProductPage";
import { allCategories, type CategorySlug } from "@/lib/categories";
import { DEFAULT_COUNTRY, getCountryByCode } from "@/lib/countries";
import {
  getAlternateLanguages,
  getOpenGraph,
  truncateTitle,
} from "@/lib/metadata";
import { type Product } from "@/lib/product-definitions";
import {
  getAllProductSlugs,
  getPDPRenderData,
} from "@/lib/server/cached-products";
import { logPDPPerformance } from "@/lib/server/performance-registry";
import { BRAND_DOMAIN, BRAND_NAME, CACHE_VERSION } from "@/lib/site-config";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { isProductHighQuality } from "@/lib/utils/quality";
import { getProductCanonicalUrl, getProductPath } from "@/lib/utils/url";
import { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

export interface Props {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    condition?: string;
  }>;
}
// Generate static params for all products (Germany only)
// NOTE: During the build phase (Next.js build), the database is excluded to keep Docker images thin.
// This function will return a placeholder during build, and relies on on-demand generation at runtime.
export async function generateStaticParams() {
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";

  if (isBuild) {
    // Return at least one param to satisfy Next.js 15 "Cache Component" validation requirements.
    // We handle this placeholder inside the component to prevent dynamic API access during build.
    return [{ slug: "build-time-placeholder" }];
  }

  // Fetch all products for on-demand static generation at runtime
  const products = await getAllProductSlugs();

  if (products.length === 0) {
    return [{ slug: "build-time-placeholder" }];
  }

  return products.map((product) => ({
    slug: product.slug,
  }));
}

// Helper to generate rich descriptions from official specs
function generateEnrichedDescription(
  product: Product,
  category: unknown,
): string | null {
  if (!product.officialSpecifications) return null;

  try {
    const specs =
      typeof product.officialSpecifications === "string"
        ? JSON.parse(product.officialSpecifications)
        : product.officialSpecifications;
    return getEnrichedDescriptionFromSpecs(product, specs, category);
  } catch (e) {
    return null;
  }
}

function getEnrichedDescriptionFromSpecs(
  product: Product,
  specs: Record<string, any>,
  category: unknown,
): string | null {
  if (!specs || typeof specs !== "object") return null;

  // 1. Processors (Intel/AMD)
  if (
    product.category === "processors-cpus" ||
    product.title.includes("Intel") ||
    product.title.includes("AMD")
  ) {
    const cores =
      specs["Anzahl der Kerne"] || specs["Total Cores"] || specs["Cores"];
    const turbo =
      specs["Max. Turbo-Taktfrequenz"] || specs["Max Turbo Frequency"];
    const cache = specs["Cache"] || specs["L3 Cache"];
    if (cores && turbo) {
      return `${product.title} (${cores} Cores, bis zu ${turbo}, ${cache || ""}). Offizielle technische Daten & Bestpreis.`;
    }
  }

  // 2. Smartphones (Apple/Samsung)
  if (
    product.category === "smartphones" ||
    product.title.includes("iPhone") ||
    product.title.includes("Galaxy")
  ) {
    const display =
      specs["Display"] ||
      specs["Super Retina XDR Display"] ||
      specs["Display-Größe"];
    const chip = specs["Chip"] || specs["Prozessor"] || specs["Chipset"];
    const camera = specs["Kamera"] || specs["Camera"] || specs["Hauptkamera"];
    const capacity =
      specs["Kapazität"] || specs["Speicherkapazität"] || specs["Storage"];

    const parts = [];
    if (display) parts.push(display.replace(/Display/g, "").trim());
    if (chip) parts.push(chip);
    if (camera) parts.push(camera.split("\n")[0]); // Take first line often

    if (parts.length > 0) {
      return `${product.title} (${parts.join(", ")}). Technische Daten, Preisvergleich & Angebote.`;
    }
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (slug === "[slug]" || slug === "%5Bslug%5D") {
    return { title: BRAND_DOMAIN };
  }

  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";

  if (isBuild) {
    return { title: `Produkt Details | ${BRAND_DOMAIN}` };
  }

  try {
    const renderData = await getPDPRenderData(slug);
    const isParentViewMode = renderData?.isParentView || false;

    // Handle Metadata redirects (Critical for SEO: redirects in metadata set the real 3xx status code)
    if (renderData?.redirect) {
      if (renderData.isPermanent) {
        // [SEO optimization] Add noindex to the redirecting shell to help GSC clear these
        // redundant URLs from the index faster while following the 301/308.
        permanentRedirect(renderData.redirect);
      } else {
        redirect(renderData.redirect);
      }
    }

    if (!renderData || !renderData.product) {
      // Use notFound() to return a true 404 HTTP status code
      notFound();
    }

    const product = renderData.product;
    if (!product.id) {
      notFound();
    }
    const productId = product.id;

    const countryCode = DEFAULT_COUNTRY;
    const countryConfig = getCountryByCode(countryCode);
    const category = allCategories[product.category as CategorySlug];
    const price =
      product.prices[countryCode] || Object.values(product.prices)[0];

    // Quality check: Unified with sitemap and content guards
    const isQualityEnough = isProductHighQuality(product, {
      checkPrice: true,
      countryCode: countryCode,
      isParentView: isParentViewMode,
    });

    if (!isQualityEnough) {
      notFound();
    }
    const isParentView = isParentViewMode;
    const siblings = isParentView ? renderData?.variants || [] : [];
    const identity = getProductIdentity(product);

    const displayTitle = isParentView
      ? identity.modelTitle
      : identity.displayTitle;

    // SEO Title: Focused on "Comparison" and "Affordability"
    // Pattern: [Product Name] Günstig Kaufen | Preisvergleich | CleverPrices
    const BRAND_SUFFIX = ` | ${BRAND_NAME}`;
    const ACTION_SUFFIX = " Günstig Kaufen | Preisvergleich";
    const MAX_LENGTH = 65;

    // We truncate the title to ensure the Action + Brand are visible
    const availableForTitle =
      MAX_LENGTH - (ACTION_SUFFIX.length + BRAND_SUFFIX.length);
    const title =
      truncateTitle(displayTitle, availableForTitle) +
      ACTION_SUFFIX +
      BRAND_SUFFIX;

    // German description with Action Verb + value proposition (Max ~160 chars)
    // Try enriched description first
    const enrichedDesc = generateEnrichedDescription(product, category);

    const description =
      enrichedDesc ||
      `${displayTitle} im Preisvergleich. Aktueller Bestpreis: ${price?.toFixed(2)}€ (${countryConfig?.currency || "EUR"}). Jetzt Top-Hardware Angebote vergleichen und sparen bei ${BRAND_NAME}.`;

    // [SEO Triad Enforced - v220] Use ONLY the canonical ID and Slug resolved by getPDPRenderData
    // We removed the fallback to product.id (Real Variant ID 200M) to prevent GSC mismatches.
    const effectiveId = renderData?.canonicalId || product.id;
    const effectiveSlug = renderData?.canonicalSlug || product.slug;
    const canonicalPath = getProductPath(
      effectiveId || product.id,
      effectiveSlug || product.slug,
    );

    return {
      title,
      description,
      other: {
        "deploy-v": CACHE_VERSION,
      },
      alternates: {
        canonical: getProductCanonicalUrl(effectiveId, effectiveSlug),
        languages: getAlternateLanguages(canonicalPath),
      },
      openGraph: getOpenGraph({
        title: `${displayTitle} Preisvergleich | ${BRAND_NAME}`,
        description,
        url: getProductCanonicalUrl(effectiveId, effectiveSlug),
        locale: "de_DE",
        type: "article",
        images: product.image
          ? [
              {
                url: product.image,
                width: 800,
                height: 800,
                alt: product.title,
              },
            ]
          : undefined,
      }),
      keywords: [
        product.brand,
        product.title,
        "Preisvergleich",
        "günstig kaufen",
        `${category?.name} Preis`,
        "beste Angebot",
        "Deutschland",
      ].filter(Boolean) as string[],
    };
  } catch (error: any) {
    if (
      error?.digest?.startsWith("NEXT_") ||
      error?.digest === "HANGING_PROMISE_REJECTION"
    ) {
      throw error;
    }
    console.error(`[Metadata Error] Product ${slug}:`, error);
    return {
      title: `Produkt Details | ${BRAND_DOMAIN}`,
      robots: { index: false, follow: true },
    };
  }
}

export default function ProductPage({ params, searchParams }: Props) {
  // During build phase, we wrap in Suspense to satisfy Next.js 15 "blocking route" checks.
  // At runtime, we allow pure SSR to prevent the "blank screen" flash.
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";

  if (isBuild) {
    return (
      <Suspense fallback={null}>
        <ProductPageContent params={params} searchParams={searchParams} />
      </Suspense>
    );
  }

  return <ProductPageContent params={params} searchParams={searchParams} />;
}

async function ProductPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ condition?: string }>;
}) {
  const { slug } = await params;

  // Handle static collection for the dynamic template route
  if (
    slug === "[slug]" ||
    slug === "%5Bslug%5D" ||
    slug === "build-time-placeholder"
  ) {
    return <div className="hidden" />;
  }

  await connection();

  const { condition } = await searchParams;

  return <ProductPageCache slug={slug} condition={condition} />;
}

async function ProductPageCache({
  slug,
  condition,
}: {
  slug: string;
  condition?: string;
}) {
  "use cache";
  cacheLife("product_v5");
  const _v = CACHE_VERSION; // Global Build ID Cache Buster
  const countryCode = DEFAULT_COUNTRY;

  let action:
    | { type: "notFound" }
    | { type: "redirect"; url: string; permanent: boolean }
    | null = null;
  let renderContent = null;

  try {
    const startTime = performance.now();

    // 1. Fetch essential DB data via High-Speed Cache Bundle
    const data = await getPDPRenderData(slug, countryCode);

    if (data?.redirect) {
      logPDPPerformance(slug, startTime);
      console.log(
        `[SEO Redirect] ${data.isPermanent ? "301/308" : "302/307"} ${slug} -> ${data.redirect}`,
      );
      action = {
        type: "redirect",
        url: data.redirect,
        permanent: !!data.isPermanent,
      };
    } else {
      const product = data?.product;
      const parentViewMode = data?.isParentView || false;

      if (!product) {
        logPDPPerformance(slug, startTime);
        action = { type: "notFound" };
      } else {
        // Unified Quality Logic:
        const isQualityEnough = isProductHighQuality(product, {
          checkPrice: true,
          countryCode: countryCode,
          isParentView: parentViewMode,
        });

        if (!isQualityEnough) {
          logPDPPerformance(slug, startTime);
          action = { type: "notFound" };
        } else {
          // 1. All data is now pre-fetched in parallel within the getPDPRenderData bundle
          const category = data?.category;
          const allVariantsRaw = (data?.variants || []) as Product[];

          renderContent = (
            <>
              <div
                className="hidden"
                data-v={CACHE_VERSION}
                aria-hidden="true"
              />
              <IdealoProductPage
                product={product}
                variants={allVariantsRaw}
                category={category}
                countryCode={countryCode}
                selectedCondition={condition as "new" | "used" | "renewed"}
                isParentView={parentViewMode}
                canonicalId={data?.canonicalId}
              />
            </>
          );
        }
      }
    }
  } catch (error: any) {
    if (
      error?.digest?.startsWith("NEXT_") ||
      error?.digest === "HANGING_PROMISE_REJECTION"
    ) {
      throw error;
    }
    console.error(`[Page Error] Product ${slug}:`, error);
    // CRITICAL: Do NOT fall back to notFound for database/server errors
    // This prevents mass de-indexing during temporary DB outages.
    throw error;
  }

  if (action?.type === "redirect") {
    if (action.permanent) permanentRedirect(action.url);
    else redirect(action.url);
  }

  if (action?.type === "notFound") {
    notFound();
  }

  return renderContent;
}
