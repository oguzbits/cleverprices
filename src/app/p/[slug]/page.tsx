import { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { IdealoProductPage } from "@/components/product/IdealoProductPage";
import { ServerBusy } from "@/components/ui/ServerBusy";
import { DatabaseBusyError } from "@/db/utils";
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
import { BRAND_DOMAIN, BRAND_NAME, CACHE_VERSION } from "@/lib/site-config";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { isProductHighQuality } from "@/lib/utils/quality";
import { getProductCanonicalUrl, getProductPath } from "@/lib/utils/url";

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
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";

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
  category: any,
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
  category: any,
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
    let renderData;
    try {
      renderData = await getPDPRenderData(slug, DEFAULT_COUNTRY);

  } catch (error: unknown) {
    if (
      error instanceof DatabaseBusyError ||
      (error as { name?: string })?.name === "DatabaseBusyError"
    ) {
      return { title: `Service Busy | ${BRAND_DOMAIN}` };
    }
    const err = error as { digest?: string };
    if (
      err?.digest?.startsWith("NEXT_") ||
      err?.digest === "HANGING_PROMISE_REJECTION"
    ) {
      throw error;
    }
    console.error(`[Metadata Error] Product ${slug}:`, error);
    return {
      title: `Produkt Details | ${BRAND_DOMAIN}`,
      robots: { index: false, follow: true },
    };
  }

  const category = renderData && !("redirect" in renderData) ? renderData.category : null;
  const isParentViewMode = renderData && !("redirect" in renderData) ? renderData.isParentView : false;

  // Handle Metadata redirects (Critical for SEO: redirects in metadata set the real 3xx status code)
  if (renderData && "redirect" in renderData) {
    if (renderData.isPermanent) {
      permanentRedirect(renderData.redirect);
    } else {
      redirect(renderData.redirect);
    }
  }

  if (!renderData || !("product" in renderData)) {
    notFound();
  }

  const product = renderData.product;
  if (!product.id) {
    notFound();
  }

  const countryCode = DEFAULT_COUNTRY;
  const countryConfig = getCountryByCode(countryCode);

  // DEFENSIVE: Ensure product.prices exists before access
  const productPrices = product.prices || {};
  const price = productPrices[countryCode] || Object.values(productPrices)[0];

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
  const identity = getProductIdentity(product);

  const displayTitle = isParentView
    ? identity.modelTitle
    : identity.displayTitle;

  const BRAND_SUFFIX = ` | ${BRAND_NAME}`;
  const ACTION_SUFFIX = " Günstig Kaufen | Preisvergleich";
  const MAX_LENGTH = 65;

  const availableForTitle =
    MAX_LENGTH - (ACTION_SUFFIX.length + BRAND_SUFFIX.length);
  const title =
    truncateTitle(displayTitle, availableForTitle) +
    ACTION_SUFFIX +
    BRAND_SUFFIX;

  const enrichedDesc = generateEnrichedDescription(product, category);

  const description =
    enrichedDesc ||
    `${displayTitle} im Preisvergleich. Aktueller Bestpreis: ${price?.toFixed(2)}€ (${countryConfig?.currency || "EUR"}). Jetzt Top-Hardware Angebote vergleichen und sparen bei ${BRAND_NAME}.`;

  const effectiveId = renderData?.canonicalId || product.id;
  const effectiveSlug = renderData?.canonicalSlug || product.slug;
  const canonicalPath = getProductPath(effectiveId, effectiveSlug);

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
      `${category?.name || ""} Preis`,
      "beste Angebot",
    ].filter(Boolean) as string[],
  };


  } catch (error: unknown) {
    // Preserve Next.js internal errors (redirect/notFound)
    const err = error as { digest?: string };
    if (err?.digest?.startsWith("NEXT_")) {
      throw error;
    }
    console.error(`[Metadata Critical Error] ${slug}:`, error);
    return { title: `${BRAND_NAME} | Hardware Preisvergleich` };
  }
}




export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;

  // Handle static collection for the dynamic template route
  if (
    slug === "[slug]" ||
    slug === "%5Bslug%5D" ||
    slug === "build-time-placeholder"
  ) {
    return <div className="hidden" aria-hidden="true" />;
  }

  const searchParamsPromise = searchParams;
  const countryCode = DEFAULT_COUNTRY;

  const result = await (async () => {
    try {
      const data = await getPDPRenderData(slug, countryCode);

      if (data && "redirect" in data) {
        return { redirect: data.redirect, isPermanent: data.isPermanent };
      }

      if (!data || !("product" in data)) {
        return { notFound: true };
      }

      const product = data.product;
      const category = data.category;
      const isParentViewMode = data.isParentView || false;


      if (!product) {
        return { notFound: true };
      }

      const isQualityEnough = isProductHighQuality(product, {
        checkPrice: true,
        countryCode: countryCode,
        isParentView: isParentViewMode,
      });

      if (!isQualityEnough) {
        return { notFound: true };
      }

      return {
        product,
        variants: (data.variants || []) as Product[],
        category: data.category,
        parentViewMode: isParentViewMode,
        canonicalId: data.canonicalId,
        similarSidebar: data.similarSidebar,
        similarCarousel: data.similarCarousel,
        isBusy: false,
      };
    } catch (error: unknown) {
      if (
        error instanceof DatabaseBusyError ||
        (error as { name?: string })?.name === "DatabaseBusyError"
      ) {
        return { isBusy: true };
      }
      const err = error as { digest?: string };
      if (
        err?.digest?.startsWith("NEXT_") ||
        err?.digest === "HANGING_PROMISE_REJECTION"
      ) {
        throw error;
      }
      console.error(`[Page Error] Product ${slug}:`, error);
      throw error;
    }
  })();

  if (result.isBusy) return <ServerBusy />;
  if (result.redirect) {
    if (result.isPermanent) permanentRedirect(result.redirect);
    else redirect(result.redirect);
  }
  if (result.notFound) notFound();

  return (
    <>
      <div className="hidden" data-v={CACHE_VERSION} aria-hidden="true" />
      <IdealoProductPage
        product={result.product!}
        variants={result.variants!}
        category={result.category ?? undefined}
        countryCode={countryCode}
        searchParamsPromise={searchParamsPromise}
        isParentView={result.parentViewMode!}
        canonicalId={result.canonicalId}
        similarSidebar={result.similarSidebar}
        similarCarousel={result.similarCarousel}
        renderTimestamp={Date.now()}
      />
    </>
  );
}
