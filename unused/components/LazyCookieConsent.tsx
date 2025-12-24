"use client";

import dynamic from "next/dynamic";

// Lazy load CookieConsent - not critical for initial render
const CookieConsent = dynamic(
  () =>
    import("@/components/CookieConsent").then((mod) => ({
      default: mod.CookieConsent,
    })),
  { ssr: false },
);

export function LazyCookieConsent() {
  return <CookieConsent />;
}
