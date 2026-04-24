import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { CATEGORY_MAP } from "@/lib/category-definitions";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getAlternateLanguages } from "@/lib/metadata";
import { CACHE_VERSION, SITE_URL } from "@/lib/site-config";
import { Metadata } from "next";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { Suspense } from "react";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// export const dynamic = "force-dynamic"; // Incompatible with cacheComponents

export const metadata: Metadata = {
  title: `Hardware Deals & Angebote | cleverprices`,
  description:
    "Finden Sie die besten Hardware-Deals und Technik-Angebote. Täglich geprüfte Preise für SSDs, HDDs, RAM und mehr.",
  alternates: {
    canonical: `${SITE_URL}/deals`,
    languages: getAlternateLanguages("/deals"),
  },
};

export default function DealsPage({ searchParams }: Props) {
  // During build phase, we wrap in Suspense to satisfy Next.js 15 "blocking route" checks.
  // At runtime, we allow pure SSR to prevent the "blank screen" flash.
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";

  if (isBuild) {
    return (
      <Suspense fallback={null}>
        <DealsPageContent searchParams={searchParams} />
      </Suspense>
    );
  }

  return <DealsPageContent searchParams={searchParams} />;
}

async function DealsPageContent({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  await connection();
  const resolvedSearchParams = await searchParams;
  return <DealsPageCache resolvedSearchParams={resolvedSearchParams} />;
}

async function DealsPageCache({
  resolvedSearchParams,
}: {
  resolvedSearchParams: any;
}) {
  "use cache";
  cacheLife("category");
  const _v = CACHE_VERSION; // Global Build ID Cache Buster
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
