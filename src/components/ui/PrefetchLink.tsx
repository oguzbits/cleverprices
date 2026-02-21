"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface PrefetchLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** Also prefetch eagerly on hover/focus (on top of viewport-based prefetching) */
  prefetchOnHover?: boolean;
}

/**
 * Enhanced Link component that adds hover/focus prefetching on top of
 * Next.js's built-in viewport-based prefetching.
 *
 * NOTE: Do NOT set prefetch={false} here. Disabling auto-prefetch means
 * every click requires a fresh server fetch in production, causing the
 * App Router to silently hold on the old page for 1-3s (no loading indicator)
 * until the RSC payload arrives. Second click or window resize "works" because
 * it flushes the already-completed-but-unrendered transition commit.
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
      onMouseEnter={prefetchOnHover ? handlePrefetch : undefined}
      onFocus={prefetchOnHover ? handlePrefetch : undefined}
    >
      {children}
    </Link>
  );
}
