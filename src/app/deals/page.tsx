import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { CATEGORY_MAP } from "@/lib/category-definitions";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { cacheLife } from "next/cache";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = {
  title: `Hardware Deals & Angebote | cleverprices`,
  description:
    "Finden Sie die besten Hardware-Deals und Technik-Angebote. Täglich geprüfte Preise für SSDs, HDDs, RAM und mehr.",
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
