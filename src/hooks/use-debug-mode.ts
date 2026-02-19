"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useDebugMode() {
  const [isDebug, setIsDebug] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("cp_debug_mode") === "true";
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    const adminParam = searchParams?.get("admin");

    if (adminParam === "true" || adminParam === "1") {
      localStorage.setItem("cp_debug_mode", "true");
      setIsDebug(true);
    } else if (adminParam === "false" || adminParam === "0") {
      localStorage.removeItem("cp_debug_mode");
      setIsDebug(false);
    }
  }, [searchParams]);

  return isDebug;
}
