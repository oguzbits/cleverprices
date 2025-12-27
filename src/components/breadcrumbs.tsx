import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BreadcrumbItem } from "@/types";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("mb-8", className)} aria-label="Breadcrumb">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 gap-y-2 text-sm leading-normal sm:gap-2 sm:text-base">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <li className="text-muted-foreground/50" aria-hidden="true">
                /
              </li>
            )}
            <li>
              {item.href && index < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="text-primary hover:underline transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span
                  className={cn(
                    "wrap-break-word",
                    index === items.length - 1 && "text-foreground font-medium",
                  )}
                >
                  {item.name}
                </span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

// Structured data for SEO
export function BreadcrumbStructuredData({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items
      .filter((item) => item.href)
      .map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `https://realpricedata.com${item.href}`,
      })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
