import HomeContent from "@/components/HomeContent";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getHomePageMetadata } from "@/lib/metadata";
import { Metadata } from "next";

import { Suspense } from "react";

export const metadata: Metadata = getHomePageMetadata(DEFAULT_COUNTRY);

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent country={DEFAULT_COUNTRY} />
    </Suspense>
  );
}
