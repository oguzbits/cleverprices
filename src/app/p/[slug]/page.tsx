import { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
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
function isNextNotFoundError(error: unknown): boolean {
  const e = error as { digest?: string; message?: string; $$typeof?: string };
  return !!(
    e?.digest?.includes("NEXT_NOT_FOUND") ||
    e?.message?.includes("NEXT_NOT_FOUND") ||
    e?.$$typeof === "next.not-found"
  );
}

function isNextRedirectError(error: unknown): boolean {
  const e = error as { digest?: string; message?: string };
  return !!(
    e?.digest?.includes("NEXT_REDIRECT") ||
    e?.message?.includes("NEXT_REDIRECT")
  );
}

/**
 * Static params generation - Required for build-time validation when using Cache Components
 */
export async function generateStaticParams() {
  return [{ slug: "build-time-placeholder" }];
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  try {
    // 1. Await params early for Next.js 16 trackability
    const { slug } = await params;

    if (!slug || slug === "build-time-placeholder") {
      return { title: BRAND_NAME };
    }

    const renderData = await getPDPRenderData(slug, DEFAULT_COUNTRY);
    if (!renderData || "redirect" in renderData) {
      return { title: BRAND_NAME };
    }

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
  } catch (error) {
    // Silent failure for metadata to avoid 500ing the whole page
    console.error(`[Metadata Failure]`, error);
    return { title: BRAND_NAME };
  }
}

export default async function ProductPage({ params, searchParams }: Props) {
  "use cache";
  cacheLife("minutes");

  // 1. Await ALL props immediately for stable SSR trackability (Next.js 16/15)
  const [{ slug }, searchParamsResolved] = await Promise.all([
    params,
    searchParams.catch(() => ({})),
  ]);

  // 2. Early Guard for Build-Time Placeholder
  if (!slug || slug === "build-time-placeholder") {
    return <div className="hidden" aria-hidden="true" />;
  }

  const countryCode = DEFAULT_COUNTRY;
  const rawCondition = (searchParamsResolved as Record<string, any>).condition;
  const condition = (typeof rawCondition === "string" ? rawCondition : "new")
    .toLowerCase()
    .trim();

  let data: Awaited<ReturnType<typeof getPDPRenderData>> | null = null;

  try {
    // 3. Fetch Orchestrated Data
    data = await getPDPRenderData(slug, countryCode);
  } catch (error) {
    // CRITICAL: Re-throw Next.js internal errors so they can be caught by the framework
    if (isNextNotFoundError(error) || isNextRedirectError(error)) {
      throw error;
    }

    console.error(`[PDP Page Crash]`, error);

    // [PREMIUM FALLBACK UI]
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="mb-6 rounded-full bg-blue-100 p-4 text-blue-600">
          <svg
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-extrabold text-transparent">
          Dienst vorübergehend nicht erreichbar
        </h1>
        <p className="mt-4 max-w-md text-lg text-slate-600">
          Wir konnten dieses Produkt gerade nicht laden. Unser System wurde
          benachrichtigt und arbeitet an einer Lösung.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95"
          >
            Zur Startseite
          </Link>
          <button
            onClick={() =>
              typeof window !== "undefined" && window.location.reload()
            }
            className="rounded-xl border border-slate-200 bg-white px-8 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  if ("redirect" in data) {
    redirect(data.redirect!);
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
        category={data.category}
        countryCode={countryCode}
        selectedCondition={condition as "new" | "used" | "renewed"}
        isParentView={data.isParentView}
        canonicalId={data.canonicalId}
        similarSidebar={data.similarSidebar}
        similarCarousel={data.similarCarousel}
      />
    </div>
  );
}
