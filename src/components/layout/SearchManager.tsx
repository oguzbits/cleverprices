"use client";

import * as React from "react";
import dynamic from "next/dynamic";

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

  // Expose toggle to window object so disconnected SearchButtons can call it
  React.useEffect(() => {
    window.triggerSearch = () => setOpen((prev) => !prev);

    // Global shortcut (Cmd+K / Ctrl+K)
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return <SearchModal open={open} onOpenChange={setOpen} />;
}
