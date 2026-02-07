import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { getCategoryBySlug, stripCategoryIcon } from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getNicheBySlug } from "@/lib/intelligence/seo-niche";
import { getOpenGraph } from "@/lib/metadata";
import { BRAND_DOMAIN } from "@/lib/site-config";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const niche = await getNicheBySlug(slug);
  if (!niche) return { title: "Seite nicht gefunden" };

  const canonicalUrl = `https://${BRAND_DOMAIN}/best/${slug}`;

  return {
    title: `${niche.title} | ${BRAND_DOMAIN}`,
    description: `Aktueller Preisvergleich & Kaufberatung: ${niche.title}. Die besten Angebote und Schnäppchen für ${niche.category} in Deutschland.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: getOpenGraph({
      title: niche.title,
      description: `Finden Sie die besten ${niche.category} im Preisvergleich.`,
      url: canonicalUrl,
      locale: "de_DE",
    }),
  };
}

export default async function BestNichePage({ params }: Props) {
  const { slug } = await params;
  const niche = await getNicheBySlug(slug);

  if (!niche) notFound();

  const category = await getCategoryBySlug(niche.category);
  if (!category) notFound();

  // Combine niche filters with defaults
  const searchParams: any = {};
  if (niche.filters.maxPrice) {
    searchParams.maxPrice = niche.filters.maxPrice.toString();
  }
  if (niche.filters.brand) {
    searchParams.brand = niche.filters.brand;
  }

  // Lock filters that are defined in the niche
  const lockedFilters: string[] = [];
  if (niche.filters.brand) {
    lockedFilters.push("brand");
  }

  return (
    <div className="niche-seo-wrapper">
      <IdealoCategoryPage
        category={{
          ...stripCategoryIcon(category),
          name: niche.title, // Inject SEO Title as Category Name
        }}
        countryCode={DEFAULT_COUNTRY}
        searchParams={searchParams}
        lockedFilters={lockedFilters}
      />
    </div>
  );
}
