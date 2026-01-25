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
} from "@/lib/product-registry";
import {
  getAllProductSlugs,
  getProductBySlug,
} from "@/lib/server/cached-products";
import { BRAND_DOMAIN } from "@/lib/site-config";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

// Universal Product Resolver (ID-based + Legacy Fallbacks)
async function resolveProductFromRoute(slug: string) {
  // 1. New ID-Based Routing (e.g. 900123456_-apple-iphone)
  const idMatch = slug.match(/^(\d+)_-(.*)$/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);

    // Synthetic Parent (Hub)
    if (id >= 900000000) {
      const product = await findProductBySyntheticId(id);
      if (!product) return null;
      const { slug: canonical } = getFamilyIdentity(product, []);
      const redirect = slug !== canonical ? `/p/${canonical}` : null;
      return { product, isParentView: true, redirect };
    }

    // Standard Product
    // Handle 200m offset or legacy raw ID
    const realId = id >= 200000000 ? id - 200000000 : id;
    const product = await getProductById(realId);
    if (!product) return null;

    // Standardize to 200m offset for the canonical URL
    const canonicalId = 200000000 + realId;
    const { slug: canonical } = getFamilyIdentity(
      { ...product, id: canonicalId },
      [],
    );

    const redirect = slug !== canonical ? `/p/${canonical}` : null;
    return { product, isParentView: false, redirect };
  }

  // 2. Legacy: Exact Slug Match
  let product = await getProductBySlug(slug, false, true);
  if (product) {
    // Determine new ID-based slug for redirect
    const { slug: newSlug } = getFamilyIdentity(product, []); // Assume single item context
    // If we want to force migration:
    const redirectUrl = `/p/${newSlug}`; // 301 to new format
    return { product, isParentView: false, redirect: redirectUrl };
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
    if (newSlug !== slug)
      return { product: null, isParentView: false, redirect: `/p/${newSlug}` };
  }

  // 4. Legacy: Parent ASIN Suffix (Hub)
  product = await findProductByParentAsinSuffix(slug);
  if (product) {
    // Generate new Synthetic Slug
    const syntheticId = 900000000 + ((product.id || 0) % 100000000);
    (product as any).syntheticId = syntheticId;
    const { slug: newHubSlug } = getFamilyIdentity(product, []);

    return { product, isParentView: true, redirect: `/p/${newHubSlug}` };
  }

  return null;
}

interface Props {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    condition?: string;
  }>;
}
// Generate static params for all products (Germany only)
export async function generateStaticParams() {
  const products = await getAllProductSlugs();

  // Cache Components requires at least one result
  // If no products in DB yet, return a placeholder that will 404
  if (products.length === 0) {
    return [{ slug: "[slug]" }];
  }

  // Limit to top 100 products by updatedAt to keep deployment size manageable
  // Modern Next.js will generate the rest on-demand and cache them
  return products.slice(0, 100).map((product) => ({
    slug: product.slug,
  }));
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

    // SEO-optimized Title
    const seoTitle = isParentView ? identity.fullModel : product.title;
    const title = `${seoTitle}${unitPriceText} - CleverPrices | ${BRAND_DOMAIN}`;

    // German description with Action Verb + value proposition (Max ~160 chars)
    const description =
      pricePerUnit && category?.unitType
        ? `Vergleichen Sie ${product.title}. Bester Preis: ${price?.toFixed(2)}€ (${pricePerUnit}€/${category.unitType}). Jetzt Top-Angebot finden!`
        : `Vergleichen Sie ${product.title}. Aktueller Bestpreis: ${countryConfig?.currency || "EUR"} ${price?.toFixed(2)}. Finden Sie jetzt das günstigste Angebot bei CleverPrices.`;

    const canonicalUrl = `https://${BRAND_DOMAIN}/p/${slug}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: getAlternateLanguages(`/p/${slug}`),
      },
      openGraph: getOpenGraph({
        title,
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
    // 1. Fetch essential DB data (Lightning Fast)
    const resolution = await resolveProductFromRoute(slug);

    if (resolution?.redirect) {
      redirect(resolution.redirect);
    }

    let product = resolution?.product;
    const parentViewMode = resolution?.isParentView || false;

    if (!product) {
      notFound();
    }

    // GSC Fix: Return 404 for products with insufficient data (prevents soft 404)
    const hasPrice =
      product.prices[countryCode] ||
      product.usedPrices?.[countryCode] ||
      Object.values(product.prices).some((p) => p && p > 0) ||
      (product.usedPrices &&
        Object.values(product.usedPrices).some((p) => p && p > 0));
    const hasMeaningfulTitle =
      product.title &&
      product.title.length > 10 &&
      product.title !== product.asin;

    if (!hasPrice || !hasMeaningfulTitle) {
      notFound();
    }

    // 2. Prepare slow live data as a Promise (Non-blocking)
    const isBuild =
      process.env.CI === "true" ||
      process.env.CI === "1" ||
      process.env.NEXT_PHASE === "phase-production-build";

    // 4. Render immediately!
    return (
      <IdealoProductPage
        product={product}
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
