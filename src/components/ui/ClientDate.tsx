"use client";

import { useEffect, useState } from "react";

interface ClientDateProps {
  date: string | Date;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

function formatClientDate(
  date: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString(locale, options);
  } catch (e) {
    return "Invalid Date";
  }
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
    const frameId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same structure to avoid layout shift
    return <span className={className}>...</span>;
  }

  const displayDate = formatClientDate(date, locale, options);

  return <span className={className}>{displayDate}</span>;
}
