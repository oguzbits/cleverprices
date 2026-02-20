"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";

export function NuqsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <NuqsAdapter>{children}</NuqsAdapter>
    </Suspense>
  );
}
