import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Category } from "@/lib/categories"
import { getCategoryPath } from "@/lib/categories"

interface CategoryCardProps {
  category: Category
  country: string
}

export function CategoryCard({ category, country }: CategoryCardProps) {
  return (
    <Link 
      className="no-underline group" 
      href={getCategoryPath(category.slug, country)} 
      aria-label={`Browse ${category.name}: ${category.description}`}
    >
      <div className="flex items-center p-3 rounded-lg border border-border/50 bg-card/40 hover:bg-muted/40 hover:border-primary/30 transition-all">
        <div className="shrink-0 w-10 h-10 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          <category.icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
             <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                {category.name}
             </h3>
             {category.unitType && (
               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wider">
                 /{category.unitType}
               </span>
             )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {category.description}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-2" />
      </div>
    </Link>
  )
}
