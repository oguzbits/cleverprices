import { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { ServerBusy } from "@/components/ui/ServerBusy";
import { DatabaseBusyError } from "@/db/utils";
import { getAlternateLanguages } from "@/lib/metadata";
import { getCachedDealsPage } from "@/lib/server/cached-deals";
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
  // During build phase, we wrap in Suspense to satisfy Next.js 15 "blocking route" checks.
  // At runtime, we allow pure SSR to prevent the "blank screen" flash.
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";

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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const resolvedSearchParams = await searchParams;

  let content;
  try {
    content = await getCachedDealsPage(resolvedSearchParams);
  } catch (error: unknown) {
    if (
      error instanceof DatabaseBusyError ||
      (error as { name?: string })?.name === "DatabaseBusyError"
    ) {
      return <ServerBusy />;
    }
    throw error;
  }

  return content;
}

