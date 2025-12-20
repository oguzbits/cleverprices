"use client";

import dynamic from "next/dynamic";

const FeaturedDeals = dynamic(
  () => import("@/components/ui/featured-deals").then((mod) => ({ default: mod.FeaturedDeals })),
  { ssr: false }
);

export function ClientFeaturedDeals({ country }: { country: string }) {
  return <FeaturedDeals country={country} />;
}
