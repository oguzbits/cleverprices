"use client";

import { useEffect, useState } from "react";

interface ClientDateProps {
  date: string | Date;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

/**
 * Renders a date only on the client to avoid hydration mismatches
 * caused by server/client timezone differences.
 */
export function ClientDate({
  date,
  locale = "de-DE",
  options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  className,
}: ClientDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same structure to avoid layout shift
    return <span className={className}>...</span>;
  }

  let displayDate = "Invalid Date";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    displayDate = d.toLocaleString(locale, options);
  } catch (e) {
    // Falls back to "Invalid Date"
  }

  return <span className={className}>{displayDate}</span>;
}
