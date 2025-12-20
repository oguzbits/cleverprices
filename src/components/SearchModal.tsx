"use client";

import { CategoryButton } from "@/components/CategoryButton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getCategoryBySlug, getCategoryPath } from "@/lib/categories";
import { FEATURED_CATEGORIES, QUICK_ACCESS_CATEGORIES } from "@/lib/constants";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CategoryLink {
  name: string;
  slug: string;
  icon: LucideIcon;
}

// Build quick links from our centralized category data
const QUICK_LINKS: Record<string, CategoryLink[]> = {
  "FEATURED CATEGORIES": (FEATURED_CATEGORIES as unknown as string[])
    .map((slug) => getCategoryBySlug(slug))
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

  const params = useParams();
  const country = (params?.country as string) || DEFAULT_COUNTRY;

  const handleLinkClick = (slug: string) => {
    const path = getCategoryPath(slug, country);
    router.push(path);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-3xl p-0 gap-0 bg-card border-border rounded-4xl shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Search Input Header */}
        <div className="relative px-6 py-10 md:px-12 md:py-16 border-b border-border/10 flex flex-col items-center gap-10 bg-linear-to-b from-primary/10 via-primary/5 to-transparent">
          <div className="flex flex-col items-center gap-6">
            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)] animate-in fade-in zoom-in duration-700">
              <Search className="h-12 w-12 text-primary stroke-[1.5]" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">
                Search Categories
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm md:text-lg max-w-[280px] md:max-w-md mx-auto leading-relaxed font-medium">
                Compare and find the best unit prices across all available categories.
              </DialogDescription>
            </div>
          </div>

          <div className="w-full max-w-xl relative">
            <div className="relative flex items-center gap-0 px-6 py-5 md:px-8 md:py-6 rounded-2xl border border-border bg-background">
              <Search className="h-6 w-6 text-muted-foreground/30 shrink-0" />
              <Input
                placeholder="What are you looking for?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 text-xl md:text-2xl h-auto flex-1 placeholder:text-muted-foreground/40 bg-background dark:bg-background shadow-none font-bold tracking-tight px-4 py-2"
                autoFocus
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                aria-label="Search for categories and products"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-10 pt-8 md:px-12 md:pb-12" role="region" aria-live="polite">
          {query === "" ? (
            // Show quick links when no search query
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(QUICK_LINKS).map(([section, links]) => (
                <div key={section} className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                    {section}
                  </h3>
                  <div className="flex flex-col gap-2.5">
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
                        <CategoryButton
                          key={link.slug}
                          name={link.name}
                          slug={link.slug}
                          icon={link.icon}
                          isSelected={isSelected}
                          onClick={() => handleLinkClick(link.slug)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show search results
            <div className="flex flex-col gap-8">
              {filteredCategories.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                    Search Results
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {filteredCategories.map((category, idx) => {
                      const IconComponent = category.icon;
                      const isSelected = idx === selectedIndex;
                      return (
                        <CategoryButton
                          key={category.slug}
                          name={category.name}
                          slug={category.slug}
                          icon={category.icon}
                          isSelected={isSelected}
                          onClick={() => handleLinkClick(category.slug)}
                          showExplore
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <div className="p-6 rounded-full bg-secondary w-fit">
                    <Search className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      No categories found
                    </p>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                      We couldn't find anything matching "{query}". Try another keyword like "hard drives".
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
