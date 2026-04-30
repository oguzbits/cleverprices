import { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { IdealoProductPage } from "@/components/product/IdealoProductPage";
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
  _category: Product["category"] | null,
): string | null {
  if (!product.officialSpecifications) return null;

  try {
    const specs =
      typeof product.officialSpecifications === "string"
        ? JSON.parse(product.officialSpecifications)
        : product.officialSpecifications;
    return getEnrichedDescriptionFromSpecs(product, specs);
  } catch (_e) {
    return null;
  }
}

function getEnrichedDescriptionFromSpecs(
  product: Product,
  specs: Record<string, unknown>,
): string | null {
  if (!specs || typeof specs !== "object") return null;

  const getStr = (key: string) => {
    const val = specs[key];
    return typeof val === "string" ? val : null;
  };

  // 1. Processors (Intel/AMD)
  if (
    product.category === "processors-cpus" ||
    product.title.includes("Intel") ||
    product.title.includes("AMD")
  ) {
    const cores =
      getStr("Anzahl der Kerne") || getStr("Total Cores") || getStr("Cores");
    const turbo =
      getStr("Max. Turbo-Taktfrequenz") || getStr("Max Turbo Frequency");
    const cache = getStr("Cache") || getStr("L3 Cache");
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
      getStr("Display") ||
      getStr("Super Retina XDR Display") ||
      getStr("Display-Größe");
    const chip = getStr("Chip") || getStr("Prozessor") || getStr("Chipset");
    const camera =
      getStr("Kamera") || getStr("Camera") || getStr("Hauptkamera");

    const parts = [];
    if (display) parts.push(display.replace(/Display/g, "").trim());
    if (chip) parts.push(chip);
    if (camera) parts.push(camera.split("\n")[0]);

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
    const renderData = await getPDPRenderData(slug, DEFAULT_COUNTRY);

    // Handle Metadata redirects (Critical for SEO)
    if (renderData && "redirect" in renderData) {
      if (renderData.isPermanent) permanentRedirect(renderData.redirect);
      else redirect(renderData.redirect);
    }

    if (!renderData || !("product" in renderData)) {
      notFound();
    }

    const { product, category, isParentView } = renderData;

    if (!product.id) notFound();

    const countryCode = DEFAULT_COUNTRY;
    const countryConfig = getCountryByCode(countryCode);

    // Quality check
    const isQualityEnough = isProductHighQuality(product, {
      checkPrice: true,
      countryCode: countryCode,
      isParentView: isParentView,
    });

    if (!isQualityEnough) notFound();

    const identity = getProductIdentity(product);
    const displayTitle = isParentView
      ? identity.modelTitle
      : identity.displayTitle;

    const price =
      product.prices?.[countryCode] || Object.values(product.prices || {})[0];

    const BRAND_SUFFIX = ` | ${BRAND_NAME}`;
    const ACTION_SUFFIX = " Günstig Kaufen | Preisvergleich";
    const MAX_LENGTH = 65;

    const availableForTitle =
      MAX_LENGTH - (ACTION_SUFFIX.length + BRAND_SUFFIX.length);
    const title =
      truncateTitle(displayTitle, availableForTitle) +
      ACTION_SUFFIX +
      BRAND_SUFFIX;

    const enrichedDesc = generateEnrichedDescription(
      product,
      category?.slug || null,
    );
    const description =
      enrichedDesc ||
      `${displayTitle} im Preisvergleich. Aktueller Bestpreis: ${price?.toFixed(2)}€ (${countryConfig?.currency || "EUR"}). Jetzt Top-Hardware Angebote vergleichen und sparen bei ${BRAND_NAME}.`;

    const effectiveId = renderData.canonicalId || product.id;
    const effectiveSlug = renderData.canonicalSlug || product.slug;
    const canonicalPath = getProductPath(effectiveId, effectiveSlug);

    return {
      title,
      description,
      other: { "deploy-v": CACHE_VERSION },
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
    // Preserve Next.js internal errors
    const err = error as { digest?: string };
    if (err?.digest?.startsWith("NEXT_")) throw error;

    console.error(`[Metadata Error] ${slug}:`, error);
    return {
      title: `${BRAND_NAME} | Hardware Preisvergleich`,
      robots: { index: false, follow: true },
    };
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

  const countryCode = DEFAULT_COUNTRY;
  const data = await getPDPRenderData(slug, countryCode);

  if (data && "redirect" in data) {
    if (data.isPermanent) permanentRedirect(data.redirect);
    else redirect(data.redirect);
  }

  if (!data || !("product" in data)) {
    notFound();
  }

  const {
    product,
    variants,
    category,
    isParentView,
    canonicalId,
    similarSidebar,
    similarCarousel,
  } = data;

  const isQualityEnough = isProductHighQuality(product, {
    checkPrice: true,
    countryCode: countryCode,
    isParentView: isParentView,
  });

  if (!isQualityEnough) {
    notFound();
  }

  return (
    <>
      <div className="hidden" data-v={CACHE_VERSION} aria-hidden="true" />
      <IdealoProductPage
        product={product}
        variants={variants as Product[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category={category as any}
        countryCode={countryCode}
        searchParamsPromise={searchParams}
        isParentView={isParentView}
        canonicalId={canonicalId}
        similarSidebar={similarSidebar}
        similarCarousel={similarCarousel}
      />
    </>
  );
}
