import { AllCategoriesView } from "@/components/category/AllCategoriesView";
import { getCategoryHierarchy } from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = "https://realpricedata.com/categories";

  const title = `All Categories - Amazon ${DEFAULT_COUNTRY.toUpperCase()}`;
  const description = `Browse all tracked product categories on Amazon ${DEFAULT_COUNTRY.toUpperCase()}. Compare hardware prices by true cost per TB/GB to find the best value deals.`;

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
      locale: `en_${DEFAULT_COUNTRY.toUpperCase()}`,
    }),
  };
}

export default function CategoriesPage() {
  const hierarchyRaw = getCategoryHierarchy();
  const categoryHierarchy = JSON.parse(JSON.stringify(hierarchyRaw));

  return (
    <AllCategoriesView
      categoryHierarchy={categoryHierarchy}
      countryCode={DEFAULT_COUNTRY}
    />
  );
}
