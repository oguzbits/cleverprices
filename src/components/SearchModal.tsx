"use client";

import { useState, useEffect } from "react";
import {
  Search,
  HardDrive,
  Dumbbell,
  Battery,
  Droplets,
  Baby,
  Coffee,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// Quick links data - shown immediately when search opens
const QUICK_LINKS = {
  "POPULAR CATEGORIES": [
    { name: "Hard Drives & SSDs", slug: "storage", icon: HardDrive },
    { name: "Protein Powder", slug: "protein-powder", icon: Dumbbell },
    { name: "Batteries", slug: "batteries", icon: Battery },
  ],
  "TRENDING NOW": [
    { name: "Laundry Detergent", slug: "laundry-detergent", icon: Droplets },
    { name: "Diapers", slug: "diapers", icon: Baby },
    { name: "Coffee", slug: "coffee", icon: Coffee },
  ],
};

// All categories for search
const ALL_CATEGORIES = [
  { name: "Hard Drives & SSDs", slug: "storage", icon: HardDrive },
  { name: "Protein Powder", slug: "protein-powder", icon: Dumbbell },
  { name: "Laundry Detergent", slug: "laundry-detergent", icon: Droplets },
  { name: "Diapers", slug: "diapers", icon: Baby },
  { name: "Batteries", slug: "batteries", icon: Battery },
];

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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl p-0 gap-0 bg-card"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Search categories and products</DialogTitle>
          <DialogDescription>
            Search for categories and products to find the best unit prices
          </DialogDescription>
        </VisuallyHidden>

        {/* Search Input Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              placeholder="What are you looking for?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 text-base h-auto py-0 flex-1 placeholder:text-muted-foreground/50 bg-transparent shadow-none font-medium"
              autoFocus
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              aria-label="Search for categories and products"
            />
            <kbd className="px-2 py-1 text-xs border border-border/60 rounded-md bg-muted/50 text-muted-foreground font-mono shrink-0 font-medium">
              esc
            </kbd>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-[500px] overflow-y-auto px-6 pb-6 pt-3" role="region" aria-live="polite">
          {query === "" ? (
            // Show quick links when no search query
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(QUICK_LINKS).map(([section, links]) => (
                <div key={section}>
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {section}
                  </h3>
                  <div className="space-y-3">
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
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary/15 shadow-sm' 
                              : 'border-border bg-secondary hover:border-primary hover:bg-primary/10'
                          }`}
                          aria-label={`Navigate to ${link.name} category`}
                        >
                          <IconComponent className="h-4 w-4 shrink-0 text-primary" />
                          <span className="text-xs font-medium text-primary">
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
                  <div className="space-y-3">
                    {filteredCategories.map((category, idx) => {
                      const IconComponent = category.icon;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={category.slug}
                          onClick={() => handleLinkClick(category.slug)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left group cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary/15 shadow-sm' 
                              : 'border-border bg-secondary hover:border-primary hover:bg-primary/10'
                          }`}
                          aria-label={`Navigate to ${category.name} category`}
                        >
                          <IconComponent className="h-4 w-4 shrink-0 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-primary">
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <kbd className="px-1.5 py-0.5 border rounded bg-muted/50 font-mono">
              ↑↓
            </kbd>
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 border rounded bg-muted/50 font-mono">
              ↵
            </kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 border rounded bg-muted/50 font-mono">
              ⌘K
            </kbd>
            <span>to toggle</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
