"use client";

import { useEffect, useRef, useState } from "react";

interface LazySectionProps {
  children: React.ReactNode;
  /** Height of the placeholder before content loads */
  placeholderHeight?: string;
  /** Root margin for intersection observer (how many px before viewport to trigger) */
  rootMargin?: string;
  /** CSS class for the placeholder */
  placeholderClassName?: string;
  /** Whether to render immediately (for above-fold sections) */
  immediate?: boolean;
}

/**
 * LazySection - Defers rendering of children until section is near viewport.
 *
 * Uses IntersectionObserver to detect when the section is about to become visible,
 * and only then renders the children. This prevents loading images in carousels
 * that are below the fold until the user scrolls near them.
 */
export function LazySection({
  children,
  placeholderHeight = "400px",
  rootMargin = "200px", // Start loading 200px before it enters viewport
  placeholderClassName = "",
  immediate = false,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(immediate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (immediate || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [immediate, isVisible, rootMargin]);

  if (!isVisible) {
    return (
      <div
        ref={ref}
        className={placeholderClassName}
        style={{ minHeight: placeholderHeight }}
        aria-hidden="true"
      />
    );
  }

  return <>{children}</>;
}
