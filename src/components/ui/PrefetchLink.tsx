"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface PrefetchLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** Prefetch on hover/focus instead of viewport entry (Next.js Best Practices: bundle-preload) */
  prefetchOnHover?: boolean;
}

/**
 * Enhanced Link component that prefetches on hover/focus instead of viewport entry.
 * This reduces server load while maintaining near-instant navigation.
 *
 * Use this for product cards and other high-volume link lists.
 */
export function PrefetchLink({
  href,
  children,
  className,
  prefetchOnHover = true,
}: PrefetchLinkProps) {
  const router = useRouter();

  const handlePrefetch = () => {
    if (prefetchOnHover) {
      router.prefetch(href);
    }
  };

  return (
    <Link
      href={href}
      className={className}
      prefetch={prefetchOnHover ? false : undefined} // Disable auto-prefetch if hover-based
      onMouseEnter={prefetchOnHover ? handlePrefetch : undefined}
      onFocus={prefetchOnHover ? handlePrefetch : undefined}
    >
      {children}
    </Link>
  );
}
