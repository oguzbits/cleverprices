"use cache";

import HomeContent from "@/components/HomeContent";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getHomePageMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { cacheLife } from "next/cache";

export const metadata: Metadata = getHomePageMetadata(DEFAULT_COUNTRY);

export default async function HomePage() {
  cacheLife("category");
  return <HomeContent country={DEFAULT_COUNTRY} />;
}
