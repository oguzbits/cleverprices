import { cn } from "@/lib/utils";
import type { BreadcrumbItem } from "@/types";
import { Home } from "lucide-react";
import Link from "next/link";
import React from "react";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  renderLastAsH1?: boolean;
}

/**
 * Idealo-style breadcrumbs - using pure Tailwind CSS
 */
export function Breadcrumbs({
  items,
  className,
  renderLastAsH1 = false,
}: BreadcrumbsProps) {
  return (
    <nav className={cn("mb-4", className)} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 gap-y-1 text-[12px] leading-normal text-[#767676] sm:gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;
          const isHome = item.href === "/";

          const content = (
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                isLast
                  ? "text-[#2d2d2d]"
                  : "text-inherit underline! decoration-[#2d2d2d]! underline-offset-2 group-hover:decoration-[#f97316]!",
              )}
            >
              {isHome ? (
                <>
                  <Home
                    className="h-4 w-4 fill-[#2d2d2d] text-[#2d2d2d]"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{item.name}</span>
                </>
              ) : (
                <>
                  {Icon && (
                    <Icon
                      className="h-3.5 w-3.5 opacity-70"
                      aria-hidden="true"
                    />
                  )}
                  <span>{item.name}</span>
                  {item.suffix && (
                    <span className="ml-1 font-medium text-[#767676]/50 lowercase">
                      {item.suffix}
                    </span>
                  )}
                </>
              )}
            </span>
          );

          return (
            <React.Fragment key={index}>
              {/* Separator */}
              {index > 0 && (
                <li
                  className="flex items-center text-[#767676]"
                  aria-hidden="true"
                >
                  <span className="text-[10px]">/</span>
                </li>
              )}
              {/* Breadcrumb item */}
              <li className="flex items-center">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="group font-bold text-[#2d2d2d]! hover:text-[#f97316]! hover:decoration-[#f97316]!"
                    prefetch={true}
                  >
                    {content}
                  </Link>
                ) : isLast ? (
                  renderLastAsH1 ? (
                    <h1 className="inline font-normal">{content}</h1>
                  ) : (
                    <span className="inline font-normal">{content}</span>
                  )
                ) : (
                  content
                )}
              </li>
            </React.Fragment>
          );
        })}
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
        item: `https://cleverprices.com${item.href}`,
      })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
