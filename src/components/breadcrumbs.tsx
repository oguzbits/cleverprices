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

export function Breadcrumbs({
  items,
  className,
  renderLastAsH1 = false,
}: BreadcrumbsProps) {
  return (
    <nav className={cn("mb-4", className)} aria-label="Breadcrumb">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 gap-y-1 text-sm leading-normal sm:gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;
          const isHome = item.href === "/";

          const content = (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 wrap-break-word",
                isLast && "text-foreground font-bold",
              )}
            >
              {isHome ? (
                <>
                  <Home className="h-4 w-4 translate-y-px" aria-hidden="true" />
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
                    <span className="text-muted-foreground/50 ml-1 font-medium lowercase">
                      {item.suffix}
                    </span>
                  )}
                </>
              )}
            </span>
          );

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <li
                  className="text-muted-foreground/30 flex items-center"
                  aria-hidden="true"
                >
                  <span className="text-[10px]">/</span>
                </li>
              )}
              <li className="flex items-center">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-muted-foreground font-bold no-underline transition-colors hover:text-[#ff6200]"
                    prefetch={true}
                  >
                    {content}
                  </Link>
                ) : isLast ? (
                  renderLastAsH1 ? (
                    <h1 className="inline">{content}</h1>
                  ) : (
                    <span className="inline">{content}</span>
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
