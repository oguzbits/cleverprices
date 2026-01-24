import { IdealoProductPage } from "@/components/product/IdealoProductPage";
import { allCategories, type CategorySlug } from "@/lib/categories";
import { DEFAULT_COUNTRY, getCountryByCode } from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import {
  findProductByParentAsinSuffix,
  findProductSlugByAsinSuffix,
} from "@/lib/product-registry";
import {
  getAllProductSlugs,
  getProductBySlug,
} from "@/lib/server/cached-products";
import { BRAND_DOMAIN } from "@/lib/site-config";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

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
    let product = await getProductBySlug(slug);
    let isParentViewMode = false;

    if (!product) {
      // 1. Try resolving by ASIN suffix (Redirect logic)
      const newSlug = await findProductSlugByAsinSuffix(slug);
      if (newSlug && newSlug !== slug) {
        const canonicalUrl = `https://${BRAND_DOMAIN}/p/${newSlug}`;
        return {
          title: "Produkt verschoben - CleverPrices",
          alternates: { canonical: canonicalUrl },
          robots: { index: false, follow: true },
        };
      }

      // 2. Try resolving by PARENT ASIN suffix (Neutral URL logic)
      product = await findProductByParentAsinSuffix(slug);
      if (product) {
        isParentViewMode = product.isParentView || false;
      }
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
    let product = await getProductBySlug(slug, false, true);

    if (!product) {
      // 1.1 Try resolving by ASIN suffix
      const newSlug = await findProductSlugByAsinSuffix(slug);
      if (newSlug && newSlug !== slug) {
        redirect(`/p/${newSlug}`);
      }

      // 1.2 Try resolving by PARENT ASIN suffix (Neutral URL)
      product = await findProductByParentAsinSuffix(slug);

      if (!product) {
        notFound();
      }
    }

    const parentViewMode = product.isParentView;

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
