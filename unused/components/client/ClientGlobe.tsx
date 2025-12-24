"use client";

import dynamic from "next/dynamic";

const Globe = dynamic(
  () => import("@/components/ui/globe").then((mod) => ({ default: mod.Globe })),
  { ssr: false },
);

export function ClientGlobe({ className }: { className?: string }) {
  return <Globe className={className} />;
}
