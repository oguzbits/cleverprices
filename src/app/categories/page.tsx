import { AllCategoriesView } from "@/components/category/AllCategoriesView";
import { getCategoryHierarchy } from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { getSiteUrl } from "@/lib/site-config";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = getSiteUrl("/categories");

  const title = `Alle Kategorien - Preisvergleich`;
  const description = `Durchsuchen Sie alle Produktkategorien. Vergleichen Sie Preise und finden Sie die besten Angebote.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages("/categories"),
    },
    openGraph: getOpenGraph({
      title,
      description,
      url: canonicalUrl,
      locale: `de_DE`,
    }),
  };
}

export default function CategoriesPage() {
  const hierarchy = getCategoryHierarchy();

  return (
    <div className="min-h-screen bg-white">
      <AllCategoriesView
        categoryHierarchy={hierarchy}
        countryCode={DEFAULT_COUNTRY}
      />
    </div>
  );
}
