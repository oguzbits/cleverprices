import { Metadata } from "next";
import { Suspense } from "react";

import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { getCategoryBySlug, stripCategoryIcon } from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getAlternateLanguages } from "@/lib/metadata";
import { getCategoryRenderData } from "@/lib/server/cached-products";
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

export default async function DealsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <DealsPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DealsPageContent({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const category = await getCategoryBySlug("deals");

  if (!category) {
    return <div>Category not found</div>;
  }

  // Use the standardized category rendering data logic
  // This already handles "deals" internally in getCategoryProducts
  const dataResult = await getCategoryRenderData(
    "deals",
    DEFAULT_COUNTRY,
    resolvedSearchParams,
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
