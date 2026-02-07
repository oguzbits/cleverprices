import { IdealoProductPage } from "@/components/product/IdealoProductPage";
import { allCategories, type CategorySlug } from "@/lib/categories";
import { DEFAULT_COUNTRY, getCountryByCode } from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { getFamilyIdentity } from "@/lib/product-families"; // Needed for redirects
import {
  findProductByParentAsinSuffix,
  findProductBySyntheticId,
  findProductSlugByAsinSuffix, // New
  getProductById, // New
  type Product,
} from "@/lib/product-registry";
import {
  getAllProductSlugs,
  getProductBySlug,
} from "@/lib/server/cached-products";
import { BRAND_DOMAIN } from "@/lib/site-config";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { Metadata } from "next";
import { cache } from "react";

import { notFound, permanentRedirect, redirect } from "next/navigation";

// Universal Product Resolver (ID-based + Legacy Fallbacks)
const resolveProductFromRoute = cache(async function resolveProductFromRoute(
  slug: string,
) {
  // 1. New ID-Based Routing (e.g. 900123456_-apple-iphone)
  const idMatch = slug.match(/^(\d+)_-(.*)$/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);

    // Synthetic Parent (Hub)
    if (id >= 900000000) {
      const product = await findProductBySyntheticId(id);
      if (!product) return null;

      // Enable Consensus Identity for the canonical Hub check
      const { getProductVariants } =
        await import("@/lib/server/cached-products");
      const variants = await getProductVariants(
        product,
        DEFAULT_COUNTRY,
        true,
        true,
      );

      // SINGLETON CHECK: If this 'Hub' has no variants (just itself), redirect to the standard product page (200...)
      if (variants.length <= 1) {
        // We know the real ID is id - 900000000
        const realId = id - 900000000;
        const singletonProduct = {
          ...product,
          id: realId,
          isParentView: false,
        };
        const { getFamilyIdentity } = await import("@/lib/product-families");
        const { slug: singletonSlug } = getFamilyIdentity(
          singletonProduct,
          variants,
        );
        return {
          product: null,
          isParentView: false,
          redirect: `/p/${singletonSlug}`,
          isPermanent: product.enrichmentStatus === "optimized",
        };
      }

      const { getFamilyIdentity } = await import("@/lib/product-families");
      const { slug: canonical } = getFamilyIdentity(product, variants);
      const isRedirect = slug !== canonical;
      return {
        product,
        isParentView: true,
        redirect: isRedirect ? `/p/${canonical}` : null,
        isPermanent: product.enrichmentStatus === "optimized",
      };
    }

    // Standard Product
    // Handle 200m offset or legacy raw ID
    const realId = id >= 200000000 ? id - 200000000 : id;
    const product = await getProductById(realId);
    if (!product) return null;

    // Standardize to 200m offset for the canonical URL
    const canonicalId = 200000000 + realId;

    // VARIANT FIX: We trust the slug returned by the product registry,
    // which mapDbProduct automatically ensures is canonical and ID-prefixed.
    const canonical = product.slug;
    const isRedirect = slug !== canonical;

    return {
      product,
      isParentView: false,
      redirect: isRedirect ? `/p/${canonical}` : null,
      isPermanent: product.enrichmentStatus === "optimized",
    };
  }

  // 2. Legacy: Exact Slug Match
  let product = await getProductBySlug(slug, false, true);
  if (product) {
    // Determine new ID-based slug for redirect
    const { slug: newSlug } = getFamilyIdentity(product, []); // Assume single item context
    // If we want to force migration:
    const redirectUrl = `/p/${newSlug}`; // 301 to new format
    return {
      product,
      isParentView: false,
      redirect: `/p/${newSlug}`,
      isPermanent: product.enrichmentStatus === "optimized",
    };
  }

  // 3. Legacy: ASIN Suffix
  const newSlug = await findProductSlugByAsinSuffix(slug);
  if (newSlug) {
    // This helper returns a SLUG string. Recursively resolve it?
    // Or just redirect to it. checking if it's new format?
    // findProductSlugByAsinSuffix currently returns string from DB slug column.
    // So it returns "apple-iphone-17-pro" (Legacy).
    // We will redirect to that, then hit case #2, then redirect to ID? Double redirect.
    // Acceptable for compatibility.
    if (newSlug !== slug) {
      return {
        product: null,
        isParentView: false,
        redirect: `/p/${newSlug}`,
        isPermanent: false, // Let the ID-based resolver handle the final code
      };
    }
  }

  // 4. Legacy: Parent ASIN Suffix (Hub)
  product = await findProductByParentAsinSuffix(slug);
  if (product) {
    // Generate new Synthetic Slug
    const syntheticId = 900000000 + ((product.id || 0) % 100000000);
    (product as any).syntheticId = syntheticId;
    const { slug: newHubSlug } = getFamilyIdentity(product, []);

    return {
      product,
      isParentView: true,
      redirect: `/p/${newHubSlug}`,
      isPermanent: product.enrichmentStatus === "optimized",
    };
  }

  return null;
});

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

  try {
    const resolution = await resolveProductFromRoute(slug);
    let product = resolution?.product;
    let isParentViewMode = resolution?.isParentView || false;

    // Handle Metadata redirects if needed (canonical)
    if (resolution?.redirect) {
      // We can't strictly redirect in metadata, but we can set canonical to the target
      const canonicalUrl = `https://${BRAND_DOMAIN}${resolution.redirect}`;
      return {
        title: "Produkt wird geladen...",
        alternates: { canonical: canonicalUrl },
        robots: { index: false, follow: true },
      };
    }

    if (!product) {
      return { title: "Produkt nicht gefunden - CleverPrices" };
    }

    const countryCode = DEFAULT_COUNTRY;
    const countryConfig = getCountryByCode(countryCode);
    const category = allCategories[product.category as CategorySlug];
    const price =
      product.prices[countryCode] || Object.values(product.prices)[0];

    // ... rest of the logic uses product and isParentViewMode ...
    const isParentView = isParentViewMode;
    const { getProductVariants } = await import("@/lib/server/cached-products");
    const siblings = isParentView
      ? await getProductVariants(product, countryCode, true, true) // LEAN Fetch for Metadata
      : [];
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

    // 1. Fetch essential DB data (Lightning Fast)
    const resolution = await resolveProductFromRoute(slug);

    if (resolution?.redirect) {
      logPDPPerformance(slug, startTime);
      console.log(
        `[SEO Redirect] ${resolution.isPermanent ? "301/308" : "302/307"} ${slug} -> ${resolution.redirect}`,
      );
      if (resolution.isPermanent) {
        permanentRedirect(resolution.redirect);
      } else {
        redirect(resolution.redirect);
      }
    }

    let product = resolution?.product;
    const parentViewMode = resolution?.isParentView || false;

    if (!product) {
      logPDPPerformance(slug, startTime);
      notFound();
    }

    const { getProductById } = await import("@/lib/product-registry");
    const { getProductVariants } = await import("@/lib/server/cached-products");
    const { getFamilyIdentity } = await import("@/lib/product-families");
    const { mergeLivePrices } = await import("@/lib/server/live-data");
    const { getCategoryBySlug } = await import("@/lib/categories");

    // 1. Parallelize ALL essential data fetching (Category, Variants)
    const [category, allVariantsRaw] = await Promise.all([
      getCategoryBySlug(product.category),
      getProductVariants(product, countryCode, true, true), // Lean Fetch
    ]);

    // 2. Identify the Canonical Variant ID locally from siblings (saves a DB query)
    const canonicalRealId =
      allVariantsRaw.length > 0
        ? [...allVariantsRaw].sort((a, b) => (a.id || 0) - (b.id || 0))[0]
            ?.id || null
        : product.id || null;

    // 2. Batch merge live prices for ONLY the items we really need (main + variants)
    // We merge them all at once to minimize database round-trips
    const [mergedMainProduct, ...mergedVariants] = await mergeLivePrices(
      [product, ...allVariantsRaw],
      countryCode,
    );

    // STABLE HUB RESOLUTION: Ensure "Alle Varianten" always points to the same ID
    let canonicalHubSlug: string | undefined = undefined;
    let consensusHubTitle: string | undefined = undefined;
    let consensusHubFullModel: string | undefined = undefined;

    if (!parentViewMode && canonicalRealId !== null) {
      const syntheticId = 900000000 + canonicalRealId;

      // 4. Determine representative (Hub Price)
      // If we are in HUB mode, the representative is the canonical variant.
      // Usually it's in allVariantsRaw, but if not, we fetch it and merge its price.
      let representativeFound = mergedVariants.find(
        (v) => v.id === canonicalRealId,
      );
      let representative: Product;

      if (representativeFound) {
        representative = representativeFound;
      } else if (canonicalRealId) {
        const fetched = await getProductById(canonicalRealId);
        if (fetched) {
          const [merged] = await mergeLivePrices([fetched], countryCode);
          representative = merged;
        } else {
          representative = mergedMainProduct;
        }
      } else {
        representative = mergedMainProduct;
      }

      const familyIdentity = getFamilyIdentity(
        { ...representative, id: syntheticId },
        mergedVariants,
      );
      canonicalHubSlug = familyIdentity.slug;
      consensusHubTitle = familyIdentity.title;
      consensusHubFullModel = familyIdentity.title;
    } else if (parentViewMode) {
      // We are ON the hub page.
      const familyIdentity = getFamilyIdentity(
        mergedMainProduct,
        mergedVariants,
      );
      consensusHubTitle = familyIdentity.title;
      consensusHubFullModel = familyIdentity.title;
    }

    // GSC Fix: Return 404 for products with insufficient data (prevents soft 404)
    const hasPrice =
      parentViewMode ||
      mergedMainProduct.prices[countryCode] ||
      mergedMainProduct.usedPrices?.[countryCode] ||
      Object.values(mergedMainProduct.prices).some(
        (p) => typeof p === "number" && p > 0,
      ) ||
      (mergedMainProduct.usedPrices &&
        Object.values(mergedMainProduct.usedPrices).some((p) => p && p > 0));

    const hasMeaningfulTitle =
      mergedMainProduct.title &&
      mergedMainProduct.title.length > 10 &&
      mergedMainProduct.title !== mergedMainProduct.asin;

    if (!hasPrice || !hasMeaningfulTitle) {
      logPDPPerformance(slug, startTime);
      notFound();
    }

    logPDPPerformance(slug, startTime);

    // 4. Render immediately with all pre-resolved data
    return (
      <IdealoProductPage
        product={mergedMainProduct}
        variants={mergedVariants}
        category={category}
        countryCode={countryCode}
        selectedCondition={condition as any}
        isParentView={parentViewMode}
        parentSlug={canonicalHubSlug}
        parentTitle={consensusHubTitle}
        parentFullModel={consensusHubFullModel}
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
