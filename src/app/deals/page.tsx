import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { CATEGORY_MAP } from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
  title: `Hardware Deals & Angebote | cleverprices`,
  description:
    "Finden Sie die besten Hardware-Deals und Technik-Angebote. Täglich geprüfte Preise für SSDs, HDDs, RAM und mehr.",
};

export async function generateStaticParams() {
  return [{}];
}

import { Suspense } from "react";

export default async function DealsPage({ searchParams }: Props) {
  const category = CATEGORY_MAP["deals"];

  return (
    <div className="bg-secondary min-h-screen">
      <Suspense fallback={null}>
        <DealsPageContent category={category} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DealsPageContent({
  category,
  searchParams,
}: {
  category: any;
  searchParams: Promise<any>;
}) {
  const filters = await searchParams;
  return (
    <IdealoCategoryPage
      category={{
        ...category,
        slug: "deals",
      }}
      countryCode={DEFAULT_COUNTRY}
      searchParams={filters}
    />
  );
}
