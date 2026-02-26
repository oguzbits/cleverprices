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
import { BRAND_DOMAIN, BRAND_NAME, SITE_URL } from "@/lib/site-config";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { getProductCanonicalUrl, getProductPath } from "@/lib/utils/url";
import { Metadata } from "next";
import { cacheLife } from "next/cache";

import { notFound, permanentRedirect, redirect } from "next/navigation";

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
    // Explicitly return a placeholder during build to avoid DB warnings and keep build fast.
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
  product: any,
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
  product: any,
  specs: any,
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
    let isParentViewMode = renderData?.isParentView || false;

    // Handle Metadata redirects if needed (canonical)
    if (renderData?.redirect) {
      // We can't strictly redirect in metadata, but we can set canonical to the target
      // Use SITE_URL for local testing consistency
      const canonicalUrl = `${SITE_URL}${renderData.redirect}`;
      return {
        title: "Produkt wird geladen...",
        alternates: { canonical: canonicalUrl },
        robots: { index: false, follow: true },
      };
    }

    if (!renderData || !renderData.product) {
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

    // GSC Fix: Align metadata with content guards to prevent Soft 404 indexing
    const hasPrice =
      isParentViewMode ||
      product.prices[countryCode] ||
      product.usedPrices?.[countryCode] ||
      Object.values(product.prices).some(
        (p) => typeof p === "number" && p > 0,
      ) ||
      (product.usedPrices &&
        Object.values(product.usedPrices).some((p) => Number(p) > 0));

    const hasMeaningfulTitle =
      product.title &&
      product.title.length > 2 &&
      product.title !== product.asin;

    if (!hasPrice || !hasMeaningfulTitle) {
      return {
        title: "Produkt nicht gefunden - CleverPrices",
        robots: { index: false },
      };
    }
    const isParentView = isParentViewMode;
    const siblings = isParentView ? renderData?.variants || [] : [];
    const identity = getProductIdentity(product);

    // Calculate price per unit for SEO
    const pricePerUnit =
      product.normalizedCapacity && price
        ? (price / product.normalizedCapacity).toFixed(2)
        : null;
    const unitPriceText =
      pricePerUnit && category?.unitType
        ? ` - ${pricePerUnit}€ pro ${category.unitType}`
        : "";

    // SEO-optimized Title: Ensure it stays under 65 chars
    // Pattern: [Clean Name] | Preisvergleich | Brand
    const seoTitle = isParentView ? identity.fullModel : product.title;
    const baseTitle = `${seoTitle} | Preisvergleich`;
    const title = truncateTitle(baseTitle, 60) + ` | ${BRAND_NAME}`;

    // German description with Action Verb + value proposition (Max ~160 chars)
    // Try enriched description first
    const enrichedDesc = generateEnrichedDescription(product, category);

    const description =
      enrichedDesc ||
      (pricePerUnit && category?.unitType
        ? `${product.title} Preisvergleich. Aktueller Bestpreis: ${price?.toFixed(2)}€ (${pricePerUnit}€/${category.unitType}). Bis zu 30% sparen bei ${BRAND_NAME}.`
        : `${product.title} günstig kaufen. Aktueller Preis: ${price?.toFixed(2)} ${countryConfig?.currency || "EUR"}. Jetzt Hardware-Angebote vergleichen & sparen bei ${BRAND_NAME}.`);

    // Use the ID-prefixed slug for the canonical URL to match the sitemap exactly
    const canonicalPath = getProductPath(product.id, product.slug);

    return {
      title,
      description,
      alternates: {
        canonical: getProductCanonicalUrl(product.id, product.slug),
        languages: getAlternateLanguages(canonicalPath),
      },
      openGraph: getOpenGraph({
        title: `${seoTitle} Preisvergleich | ${BRAND_DOMAIN}`,
        description,
        url: getProductCanonicalUrl(product.id, product.slug),
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
        category?.unitType ? `Preis pro ${category.unitType}` : null,
        "beste Angebot",
        "Deutschland",
      ].filter(Boolean) as string[],
    };
  } catch (error) {
    console.error(`[Metadata Error] Product ${slug}:`, error);
    return { title: "Produkt Details - CleverPrices" };
  }
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { condition } = await searchParams;

  // Handle static collection for the dynamic template route
  if (slug === "[slug]" || slug === "%5Bslug%5D") {
    return null;
  }

  return <ProductPageContent slug={slug} condition={condition} />;
}

async function ProductPageContent({
  slug,
  condition,
}: {
  slug: string;
  condition?: string;
}) {
  "use cache";
  cacheLife("product");
  const countryCode = DEFAULT_COUNTRY;

  let action:
    | { type: "notFound" }
    | { type: "redirect"; url: string; permanent: boolean }
    | null = null;
  let renderContent = null;

  try {
    const startTime = performance.now();

    // 1. Fetch essential DB data via High-Speed Cache Bundle
    const data = await getPDPRenderData(slug);

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
      let product = data?.product;
      const parentViewMode = data?.isParentView || false;

      if (!product) {
        logPDPPerformance(slug, startTime);
        action = { type: "notFound" };
      } else {
        // 1. All data is now pre-fetched in parallel within the getPDPRenderData bundle
        const category = data?.category;
        const allVariantsRaw = (data?.variants || []) as Product[];

        renderContent = (
          <IdealoProductPage
            product={product}
            variants={allVariantsRaw}
            category={category}
            countryCode={countryCode}
            selectedCondition={condition as any}
            isParentView={parentViewMode}
          />
        );
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
    action = { type: "notFound" };
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
