import { IdealoProductPage } from "@/components/product/IdealoProductPage";
import { allCategories, type CategorySlug } from "@/lib/categories";
import { DEFAULT_COUNTRY, getCountryByCode } from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { type Product } from "@/lib/product-registry";
import {
  getAllProductSlugs,
  getPDPRenderData,
} from "@/lib/server/cached-products";
import { BRAND_DOMAIN } from "@/lib/site-config";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { Metadata } from "next";

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
export async function generateStaticParams() {
  // Fetch only top 100 products for pre-generation to keep build times manageable
  const products = await getAllProductSlugs(100);

  // Cache Components requires at least one result
  // If no products in DB yet, return a placeholder that will 404
  if (products.length === 0) {
    return [{ slug: "[slug]" }];
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
  } catch (e) {
    // Fail silently to default
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
    const data = await getPDPRenderData(slug);
    let product = data?.product;
    let isParentViewMode = data?.isParentView || false;

    // Handle Metadata redirects if needed (canonical)
    if (data?.redirect) {
      // We can't strictly redirect in metadata, but we can set canonical to the target
      const canonicalUrl = `https://${BRAND_DOMAIN}${data.redirect}`;
      return {
        title: "Produkt wird geladen...",
        alternates: { canonical: canonicalUrl },
        robots: { index: false, follow: true },
      };
    }

    if (!product) {
      return {
        title: "Produkt nicht gefunden - CleverPrices",
        robots: { index: false, follow: false },
      };
    }

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
      product.title.length > 10 &&
      product.title !== product.asin;

    if (!hasPrice || !hasMeaningfulTitle) {
      return {
        title: "Produkt nicht gefunden - CleverPrices",
        robots: { index: false },
      };
    }
    const isParentView = isParentViewMode;
    const siblings = isParentView ? data?.variants || [] : [];
    const identity = getProductIdentity(product, siblings);

    // Calculate price per unit for SEO
    const pricePerUnit =
      product.normalizedCapacity && price
        ? (price / product.normalizedCapacity).toFixed(2)
        : null;
    const unitPriceText =
      pricePerUnit && category?.unitType
        ? ` - ${pricePerUnit}€ pro ${category.unitType}`
        : "";

    // SEO-optimized Title
    const seoTitle = isParentView ? identity.fullModel : product.title;
    const title = `${seoTitle}${unitPriceText} | Hardware Preisvergleich | ${BRAND_DOMAIN}`;

    // German description with Action Verb + value proposition (Max ~160 chars)
    // Try enriched description first
    const enrichedDesc = generateEnrichedDescription(product, category);

    const description =
      enrichedDesc ||
      (pricePerUnit && category?.unitType
        ? `${product.title} zum besten Preis kaufen. Aktuell nur ${price?.toFixed(2)}€ (${pricePerUnit}€/${category.unitType}). Jetzt Angebote in Deutschland vergleichen und sparen!`
        : `${product.title} günstig kaufen. Aktueller Bestpreis: ${price?.toFixed(2)} ${countryConfig?.currency || "EUR"}. Finden Sie jetzt das beste Hardware-Angebot bei ${BRAND_DOMAIN}.`);

    const canonicalPath = `/p/${product.slug}`;
    const canonicalUrl = `https://${BRAND_DOMAIN}${canonicalPath}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: getAlternateLanguages(canonicalPath),
      },
      openGraph: getOpenGraph({
        title: `${seoTitle} Preisvergleich | ${BRAND_DOMAIN}`,
        description,
        url: canonicalUrl,
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
  const countryCode = DEFAULT_COUNTRY;

  // Handle static collection for the dynamic template route
  if (slug === "[slug]" || slug === "%5Bslug%5D") {
    return null;
  }

  try {
    const startTime = performance.now();
    const { logPDPPerformance } =
      await import("@/lib/server/performance-registry");

    // 1. Fetch essential DB data via High-Speed Cache Bundle
    const data = await getPDPRenderData(slug);

    if (data?.redirect) {
      logPDPPerformance(slug, startTime);
      console.log(
        `[SEO Redirect] ${data.isPermanent ? "301/308" : "302/307"} ${slug} -> ${data.redirect}`,
      );
      if (data.isPermanent) {
        permanentRedirect(data.redirect);
      } else {
        redirect(data.redirect);
      }
    }

    let product = data?.product;
    const parentViewMode = data?.isParentView || false;

    if (!product) {
      logPDPPerformance(slug, startTime);
      notFound();
    }

    // 1. All data is now pre-fetched in parallel within the getPDPRenderData bundle
    const category = data?.category;
    const allVariantsRaw = (data?.variants || []) as Product[];

    // 2. Identify the Canonical Variant ID locally from siblings (saves a DB query)
    const canonicalRealId =
      allVariantsRaw.length > 0
        ? [...allVariantsRaw].sort((a, b) => (a.id || 0) - (b.id || 0))[0]
            ?.id || null
        : product.id || null;

    // 2. Render THE STATIC SHELL immediately
    // Live price merging is now deferred into a Suspense boundary inside IdealoProductPage
    return (
      <IdealoProductPage
        product={product}
        variants={allVariantsRaw}
        category={category}
        countryCode={countryCode}
        selectedCondition={condition as any}
        isParentView={parentViewMode}
      />
    );
  } catch (error: any) {
    if (
      error?.digest?.startsWith("NEXT_") ||
      error?.digest === "HANGING_PROMISE_REJECTION"
    ) {
      throw error;
    }
    console.error(`[Page Error] Product ${slug}:`, error);
    notFound(); // Fallback to 404 for DB errors during crawl
  }
}
