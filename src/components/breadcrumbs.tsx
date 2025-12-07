import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem } from "@/types"

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("mb-8", className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
            )}
            {item.href && index < items.length - 1 ? (
              <Link 
                href={item.href} 
                className="hover:text-foreground transition-colors hover:underline"
              >
                {item.name}
              </Link>
            ) : (
              <span className={cn(
                index === items.length - 1 && "text-foreground font-medium"
              )}>
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Structured data for SEO
export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items
      .filter(item => item.href)
      .map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `https://realpricedata.com${item.href}`
      }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
