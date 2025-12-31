"use client";

import { CategoryButton } from "@/components/CategoryButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getCategoryBySlug, getCategoryPath, type CategorySlug } from "@/lib/categories";
import { FEATURED_CATEGORIES, QUICK_ACCESS_CATEGORIES } from "@/lib/constants";
import { DEFAULT_COUNTRY, type CountryCode } from "@/lib/countries";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

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

  // Wrap onOpenChange to reset state when closing
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuery("");
      setSelectedIndex(-1);
    }
    onOpenChange(newOpen);
  };

  // Filter categories based on query
  const filteredCategories = ALL_CATEGORIES.filter((cat) =>
    cat.name.toLowerCase().includes(query.toLowerCase()),
  );

  // Get all available items (quick links or search results)
  const availableItems =
    query === "" ? Object.values(QUICK_LINKS).flat() : filteredCategories;

  const params = useParams();
  const country = (params?.country as CountryCode) || DEFAULT_COUNTRY;

  const handleLinkClick = (slug: string) => {
    const path = getCategoryPath(slug as CategorySlug, country);
    router.push(path);
    handleOpenChange(false);
  };

  // Use a ref to store the latest state for the global keydown listener
  // to avoid re-registering the listener on every render or dependency change.
  const stateRef = React.useRef({
    open,
    handleOpenChange,
    selectedIndex,
    availableItems,
    handleLinkClick,
  });

  // Update the ref after every render to ensure the keydown listener has latest state
  useEffect(() => {
    stateRef.current = {
      open,
      handleOpenChange,
      selectedIndex,
      availableItems,
      handleLinkClick,
    };
  });

  // Handle keyboard shortcuts and navigation
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const {
        open: currentOpen,
        handleOpenChange: currentHandleOpenChange,
        selectedIndex: currentSelectedIndex,
        availableItems: currentAvailableItems,
        handleLinkClick: currentHandleLinkClick,
      } = stateRef.current;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        currentHandleOpenChange(!currentOpen);
      }
      if (e.key === "Escape") {
        currentHandleOpenChange(false);
      }
      if (e.key === "ArrowDown" && currentAvailableItems.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % currentAvailableItems.length);
      }
      if (e.key === "ArrowUp" && currentAvailableItems.length > 0) {
        e.preventDefault();
        setSelectedIndex(
          (prev) =>
            (prev - 1 + currentAvailableItems.length) %
            currentAvailableItems.length,
        );
      }
      if (
        e.key === "Enter" &&
        currentSelectedIndex >= 0 &&
        currentAvailableItems.length > 0 &&
        currentAvailableItems[currentSelectedIndex]
      ) {
        e.preventDefault();
        currentHandleLinkClick(currentAvailableItems[currentSelectedIndex].slug);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []); // Run once on mount

  // Handle input change and index reset
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border flex h-dvh w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 shadow-2xl focus:outline-none **:data-[slot=dialog-close]:top-6 **:data-[slot=dialog-close]:right-6 md:h-auto md:max-h-[90vh] md:w-[calc(100%-2rem)] md:max-w-2xl md:rounded-4xl md:**:data-[slot=dialog-close]:top-8 md:**:data-[slot=dialog-close]:right-8 **:data-[slot=dialog-close]:[&_svg]:size-6!">
        {" "}
        {/* Search Input Header */}
        <div className="border-border/10 from-primary/10 via-primary/5 relative flex shrink-0 flex-col items-start gap-8 border-b bg-linear-to-b to-transparent px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-col items-start gap-5">
            <div className="bg-primary/10 border-primary/20 animate-in fade-in zoom-in rounded-2xl border p-3 shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)] duration-700">
              <Search className="text-primary h-6 w-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-foreground text-left text-2xl font-black tracking-tighter md:text-3xl">
                Search Categories
              </DialogTitle>
              <DialogDescription className="text-muted-foreground max-w-md text-left text-sm leading-relaxed font-medium md:max-w-xl md:text-base">
                Compare and find the best unit prices across all available
                categories.
              </DialogDescription>
            </div>
          </div>

          <div className="relative w-full">
            <div className="border-border bg-background relative flex items-center gap-0 rounded-xl border px-5 py-3 md:px-6 md:py-4">
              <Search className="text-muted-foreground/30 h-5 w-5 shrink-0" />
              <Input
                placeholder="What are you looking for?"
                value={query}
                onChange={handleQueryChange}
                className="placeholder:text-muted-foreground/40 bg-background dark:bg-background h-auto flex-1 border-0 px-3 py-1.5 text-base font-bold tracking-tight shadow-none focus-visible:ring-0 md:text-lg"
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
        <div
          className="flex-1 overflow-y-auto px-6 pt-6 pb-8 md:px-10 md:pb-10"
          role="region"
          aria-live="polite"
        >
          {query === "" ? (
            // Show quick links when no search query
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {Object.entries(QUICK_LINKS).map(([section, links]) => (
                <div key={section} className="flex flex-col gap-4">
                  <h3 className="text-muted-foreground px-1 text-sm font-bold tracking-[0.2em] uppercase">
                    {section}
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {links.map((link) => {
                      // Only calculate selection when in quick links mode (query is empty)
                      const globalIndex =
                        query === ""
                          ? Object.values(QUICK_LINKS)
                              .flat()
                              .findIndex((l) => l.slug === link.slug)
                          : -1;
                      const isSelected =
                        query === "" && globalIndex === selectedIndex;
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
                  <h3 className="text-muted-foreground px-1 text-sm font-bold tracking-[0.2em] uppercase">
                    Search Results
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {filteredCategories.map((category, idx) => {
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
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                  <div className="bg-secondary w-fit rounded-full p-6">
                    <Search className="text-muted-foreground/20 h-10 w-10" />
                  </div>
                  <div>
                    <p className="text-foreground text-xl font-bold">
                      No categories found
                    </p>
                    <p className="text-muted-foreground mx-auto mt-2 max-w-xs">
                      We couldn&apos;t find anything matching &quot;{query}&quot;. Try another
                      keyword like &quot;hard drives&quot;.
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
