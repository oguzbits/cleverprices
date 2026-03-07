import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { CATEGORY_MAP } from "@/lib/category-definitions";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getAlternateLanguages } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site-config";
import { Metadata } from "next";
import { cacheLife } from "next/cache";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: `Hardware Deals & Angebote | cleverprices`,
  description:
    "Finden Sie die besten Hardware-Deals und Technik-Angebote. Täglich geprüfte Preise für SSDs, HDDs, RAM und mehr.",
  alternates: {
    canonical: `${SITE_URL}/deals`,
    languages: getAlternateLanguages("/deals"),
  },
};

export default async function DealsPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;

  return <DealsPageContent resolvedSearchParams={resolvedSearchParams} />;
}

async function DealsPageContent({
  resolvedSearchParams,
}: {
  resolvedSearchParams: any;
}) {
  "use cache";
  cacheLife("category");
  const _v = "v207"; // Bust RSC cache when identity/slug logic changes
  const category = CATEGORY_MAP["deals"];

  return (
    <IdealoCategoryPage
      category={{
        ...category,
        slug: "deals",
      }}
      countryCode={DEFAULT_COUNTRY}
      searchParams={resolvedSearchParams}
    />
  );
}
