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
    const displayTitle = isParentView
      ? product.modelTitle || product.title
      : product.title;
    const price = product.prices?.[DEFAULT_COUNTRY];

    return {
      title: `${displayTitle} Preisvergleich | ${BRAND_NAME}`,
      description: `${displayTitle} im Preisvergleich. Aktueller Bestpreis: ${price ? price.toFixed(2) + "€" : "Jetzt ansehen"}. Top-Hardware Angebote bei ${BRAND_NAME}.`,
    };
  } catch (e) {
    console.error("[PDP Metadata Error]:", e);
    return { title: BRAND_NAME };
  }
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  try {
    if (!slug || slug === "build-time-placeholder") {
      return <div className="hidden" aria-hidden="true" />;
    }

    // 2. Resolve searchParams only if we are in a real request
    const searchParamsResolved = await searchParams;
    const countryCode = DEFAULT_COUNTRY;
    const condition = (searchParamsResolved.condition as string) || "new";

    // 3. Fetch Data
    const data = await getPDPRenderData(slug, countryCode);

    if (!data) {
      notFound();
    }

    if ("redirect" in data) {
      redirect(data.redirect);
    }

    // 4. Quality Guard
    if (!isProductHighQuality(data.product)) {
      console.warn(`[PDP Quality Reject] ${slug}`);
      notFound();
    }

    // 5. Render
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
    console.error(`[PDP Render Crash] ${slug}:`, error);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Produkt vorübergehend nicht erreichbar
        </h1>
        <p className="mt-2 text-slate-600">
          Wir konnten dieses Produkt gerade nicht laden. Bitte versuchen Sie es
          später erneut.
        </p>
        <a
          href="/"
          className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Zur Startseite
        </a>
      </div>
    );
  }
}
