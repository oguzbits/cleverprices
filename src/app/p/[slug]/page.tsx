import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { IdealoProductPage } from "@/components/product/IdealoProductPage";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getPDPRenderData } from "@/lib/server/cached-products";
import { BRAND_NAME } from "@/lib/site-config";
import { isProductHighQuality } from "@/lib/utils/quality";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Local helpers to detect Next.js internal errors safely
function isNextNotFoundError(error: any): boolean {
  return (
    error?.digest?.includes("NEXT_NOT_FOUND") ||
    error?.message?.includes("NEXT_NOT_FOUND") ||
    error?.$$typeof === "next.not-found"
  );
}

function isNextRedirectError(error: any): boolean {
  return (
    error?.digest?.includes("NEXT_REDIRECT") ||
    error?.message?.includes("NEXT_REDIRECT")
  );
}

/**
 * Static params generation - Required for build-time validation when using Cache Components
 */
export async function generateStaticParams() {
  return [{ slug: "build-time-placeholder" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    if (!slug || slug === "build-time-placeholder")
      return { title: BRAND_NAME };

    const renderData = await getPDPRenderData(slug, DEFAULT_COUNTRY);
    if (!renderData || "redirect" in renderData) return { title: BRAND_NAME };

    const { product, isParentView } = renderData;
    if (!product) return { title: BRAND_NAME };

    const displayTitle = isParentView
      ? product.modelTitle || product.title
      : product.title;
    const price = product.prices?.[DEFAULT_COUNTRY];

    return {
      title: `${displayTitle} Preisvergleich | ${BRAND_NAME}`,
      description: `${displayTitle} im Preisvergleich. Aktueller Bestpreis: ${price ? price.toFixed(2) + "€" : "Jetzt ansehen"}. Top-Hardware Angebote bei ${BRAND_NAME}.`,
    };
  } catch (e) {
    if (isNextNotFoundError(e) || isNextRedirectError(e)) throw e;
    console.error("[PDP Metadata Error]:", e);
    return { title: BRAND_NAME };
  }
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;

  if (!slug || slug === "build-time-placeholder") {
    return <div className="hidden" aria-hidden="true" />;
  }

  try {
    // 1. Resolve searchParams only if we are in a real request
    const searchParamsResolved = await searchParams;
    const countryCode = DEFAULT_COUNTRY;
    const condition = (searchParamsResolved.condition as string) || "new";

    // 2. Fetch Data
    const data = await getPDPRenderData(slug, countryCode);

    if (!data) {
      notFound();
    }

    if ("redirect" in data) {
      redirect(data.redirect);
    }

    // 3. Quality Guard
    if (!isProductHighQuality(data.product)) {
      console.warn(`[PDP Quality Reject] ${slug}`);
      notFound();
    }

    // 4. Render
    return (
      <div className="min-h-screen bg-slate-50">
        <IdealoProductPage
          product={data.product}
          variants={data.variants}
          category={data.category as any}
          countryCode={countryCode}
          selectedCondition={condition as any}
          isParentView={data.isParentView}
          canonicalId={data.canonicalId}
          similarSidebar={data.similarSidebar}
          similarCarousel={data.similarCarousel}
          renderTimestamp={data.renderTimestamp}
        />
      </div>
    );
  } catch (error) {
    // CRITICAL: Re-throw Next.js internal errors so they can be caught by the framework
    if (isNextNotFoundError(error) || isNextRedirectError(error)) {
      throw error;
    }

    console.error(`[PDP Page Crash] ${slug}:`, error);

    // Fallback UI for truly unexpected server errors
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Produkt vorübergehend nicht erreichbar
        </h1>
        <p className="mt-2 text-slate-600">
          Wir konnten dieses Produkt gerade nicht laden. Bitte versuchen Sie es
          später erneut.
        </p>
        <div className="mt-8 flex gap-4">
          <a
            href="/"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Zur Startseite
          </a>
          <button
            onClick={() =>
              typeof window !== "undefined" && window.location.reload()
            }
            className="rounded-lg border border-slate-300 px-6 py-2 text-slate-600 transition-colors hover:bg-slate-50"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }
}
