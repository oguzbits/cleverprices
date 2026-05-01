import { Metadata } from "next";

import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { stripCategoryIcon } from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getAlternateLanguages } from "@/lib/metadata";
import {
  getCategoryOrchestrationData,
  getCategoryRenderData,
} from "@/lib/server/cached-products";
import { SITE_URL } from "@/lib/site-config";

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

export const dynamic = "force-dynamic";

export default async function DealsPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;

  // Use the cached orchestrator for metadata/category lookup
  const { category } = await getCategoryOrchestrationData("deals");

  if (!category) {
    return <div>Category not found</div>;
  }

  const dataResult = await getCategoryRenderData(
    "deals",
    DEFAULT_COUNTRY,
    JSON.parse(JSON.stringify(resolvedSearchParams)),
  );

  return (
    <IdealoCategoryPage
      category={stripCategoryIcon(category)}
      countryCode={DEFAULT_COUNTRY}
      searchParams={resolvedSearchParams}
      initialData={dataResult}
    />
  );
}
