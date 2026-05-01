import { Metadata } from "next";

import HomeContent from "@/components/HomeContent";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getHomePageMetadata } from "@/lib/metadata";
export const metadata: Metadata = getHomePageMetadata(DEFAULT_COUNTRY);

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return <HomeContent country={DEFAULT_COUNTRY} />;
}
