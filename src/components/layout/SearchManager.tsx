"use client";

import dynamic from "next/dynamic";
import * as React from "react";

const SearchModal = dynamic(
  () => import("@/components/SearchModal").then((mod) => mod.SearchModal),
  { ssr: false },
);

// Add type for window object
declare global {
  interface Window {
    triggerSearch: () => void;
  }
}

export function SearchManager() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Only render the modal after the client has fully mounted.
  // This prevents the Radix UI focus trap / portal from initializing during
  // hydration, which was swallowing the first click event site-wide.
  React.useEffect(() => {
    setMounted(true);

    const toggle = () => setOpen((prev) => !prev);
    window.triggerSearch = toggle;

    // If a search was triggered before hydration, open it now
    if ((window as any).__searchPending) {
      setOpen(true);
      (window as any).__searchPending = false;
    }

    // Global shortcut (Cmd+K / Ctrl+K)
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Don't nullify triggerSearch to avoid breaking buttons during soft navigations
    };
  }, []);

  if (!mounted) return null;

  return <SearchModal open={open} onOpenChange={setOpen} />;
}
