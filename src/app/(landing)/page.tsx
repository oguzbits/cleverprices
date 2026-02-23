import HomeContent from "@/components/HomeContent";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getHomePageMetadata } from "@/lib/metadata";
import { Metadata } from "next";

import { connection } from "next/server";

export const metadata: Metadata = getHomePageMetadata(DEFAULT_COUNTRY);

export default async function HomePage() {
  await connection();
  return <HomeContent country={DEFAULT_COUNTRY} />;
}
