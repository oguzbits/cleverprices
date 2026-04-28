import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { CATEGORY_MAP } from "@/lib/category-definitions";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { CACHE_VERSION } from "@/lib/site-config";

/**
 * Cached version of the Deals Page content.
 * Complies with the rule: "Only use use cache in the lib/server layer."
 */
export async function getCachedDealsPage(
  resolvedSearchParams: Record<string, string | string[] | undefined>,
) {
  "use cache";
  const _v = CACHE_VERSION;
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
