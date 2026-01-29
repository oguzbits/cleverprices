"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useDebugMode() {
  const [isDebug, setIsDebug] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Check URL for activation/deactivation
    const adminParam = searchParams?.get("admin");

    if (adminParam === "true" || adminParam === "1") {
      localStorage.setItem("cp_debug_mode", "true");
      setIsDebug(true);
    } else if (adminParam === "false" || adminParam === "0") {
      localStorage.removeItem("cp_debug_mode");
      setIsDebug(false);
    } else {
      // 2. Fallback to LocalStorage
      const stored = localStorage.getItem("cp_debug_mode");
      setIsDebug(Boolean(stored));
    }
  }, [searchParams]);

  return isDebug;
}
