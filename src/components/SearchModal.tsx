"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { QUICK_ACCESS_CATEGORIES } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";

interface CategoryLink {
  name: string;
  slug: string;
  icon: LucideIcon;
}

// Build quick links from our centralized category data
const QUICK_LINKS: Record<string, CategoryLink[]> = {
  "POPULAR CATEGORIES": [
    getCategoryBySlug("hard-drives"),
    getCategoryBySlug("protein-powder"),
    getCategoryBySlug("batteries"),
  ]
    .filter(Boolean)
    .map((cat) => ({
      name: cat!.name,
      slug: cat!.slug,
      icon: cat!.icon,
    })),
  "TRENDING NOW": [
    getCategoryBySlug("laundry-detergent"),
    getCategoryBySlug("diapers"),
    getCategoryBySlug("coffee"),
  ]
    .filter(Boolean)
    .map((cat) => ({
      name: cat!.name,
      slug: cat!.slug,
      icon: cat!.icon,
    })),
};

// All searchable categories
const ALL_CATEGORIES: CategoryLink[] = QUICK_ACCESS_CATEGORIES.map((slug) => {
  const cat = getCategoryBySlug(slug);
  return cat
    ? {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
      }
    : null;
}).filter(Boolean) as CategoryLink[];


interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();

  // Filter categories based on query
  const filteredCategories = ALL_CATEGORIES.filter((cat) =>
    cat.name.toLowerCase().includes(query.toLowerCase())
  );

  // Get all available items (quick links or search results)
  const availableItems =
    query === "" ? Object.values(QUICK_LINKS).flat() : filteredCategories;

  // Handle keyboard shortcuts and navigation
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
      if (e.key === "ArrowDown" && availableItems.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % availableItems.length);
      }
      if (e.key === "ArrowUp" && availableItems.length > 0) {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + availableItems.length) % availableItems.length
        );
      }
      if (e.key === "Enter" && selectedIndex >= 0 && availableItems.length > 0 && availableItems[selectedIndex]) {
        e.preventDefault();
        handleLinkClick(availableItems[selectedIndex].slug);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange, selectedIndex, availableItems]);

  // Reset query and selection when modal closes or query changes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleLinkClick = (slug: string) => {
    router.push(`/categories/${slug}`);
    // Don't close modal immediately - let navigation happen smoothly
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full h-full max-w-full md:h-auto md:max-w-3xl p-0 gap-0 bg-card border-0 md:border rounded-none md:rounded-lg fixed inset-0 md:inset-auto translate-x-0 translate-y-0 md:translate-x-[-50%] md:translate-y-[-50%] md:top-[50%] md:left-[50%]"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Search categories and products</DialogTitle>
          <DialogDescription>
            Search for categories and products to find the best unit prices
          </DialogDescription>
        </VisuallyHidden>

        {/* Search Input Header */}
        <div className="px-4 py-4 md:px-6 md:pt-6 md:pb-4 border-b border-border/40">
          <div className="flex items-center gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-xl border border-border bg-background">
            <Search className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 text-sm md:text-base h-auto py-0 flex-1 placeholder:text-muted-foreground/50 bg-transparent shadow-none font-medium"
              autoFocus
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              aria-label="Search for categories and products"
            />
            <button
              onClick={() => onOpenChange(false)}
              className="px-1.5 py-1 md:px-2 text-[10px] md:text-xs border border-border/60 rounded-md bg-muted/50 text-muted-foreground font-mono shrink-0 font-medium hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close search modal"
            >
              esc
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-[500px] overflow-y-auto px-4 pb-4 pt-3 md:px-6 md:pb-6" role="region" aria-live="polite">
          {query === "" ? (
            // Show quick links when no search query
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {Object.entries(QUICK_LINKS).map(([section, links]) => (
                <div key={section}>
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {section}
                  </h3>
                  <div className="space-y-2.5 md:space-y-3">
                    {links.map((link, idx) => {
                      const IconComponent = link.icon;
                      // Only calculate selection when in quick links mode (query is empty)
                      const globalIndex = query === "" 
                        ? Object.values(QUICK_LINKS)
                            .flat()
                            .findIndex((l) => l.slug === link.slug)
                        : -1;
                      const isSelected = query === "" && globalIndex === selectedIndex;
                      return (
                        <button
                          key={link.slug}
                          onClick={() => handleLinkClick(link.slug)}
                          className={`w-full flex items-center gap-2.5 md:gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-xl border transition-all text-left group cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary/15 shadow-sm' 
                              : 'border-border bg-secondary hover:border-primary hover:bg-primary/10'
                          }`}
                          aria-label={`Navigate to ${link.name} category`}
                        >
                          <IconComponent className="h-4 w-4 shrink-0 text-primary" />
                          <span className="text-xs md:text-sm font-medium text-primary">
                            {link.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show search results
            <>
              {filteredCategories.length > 0 ? (
                <div>
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Categories
                  </h3>
                  <div className="space-y-2.5 md:space-y-3">
                    {filteredCategories.map((category, idx) => {
                      const IconComponent = category.icon;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={category.slug}
                          onClick={() => handleLinkClick(category.slug)}
                          className={`w-full flex items-center gap-2.5 md:gap-3 px-3 py-2.5 md:px-4 md:py-3.5 rounded-xl border transition-all text-left group cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary/15 shadow-sm' 
                              : 'border-border bg-secondary hover:border-primary hover:bg-primary/10'
                          }`}
                          aria-label={`Navigate to ${category.name} category`}
                        >
                          <IconComponent className="h-4 w-4 shrink-0 text-primary" />
                          <div className="flex-1">
                            <p className="text-xs md:text-sm font-medium text-primary">
                              {category.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">
                              Category
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-auto shrink-0 border-border/50 text-muted-foreground text-[10px] px-1.5 py-0">
                            View
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No results found for "{query}"
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try searching for categories like "batteries" or "protein"
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
