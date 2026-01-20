"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { performSearch } from "@/lib/actions/search";
import { CATEGORY_MANIFEST } from "@/lib/category-manifest";
import { CategorySlug } from "@/lib/category-types";
import { getCategoryPath } from "@/lib/category-utils";
import {
  CountryCode,
  DEFAULT_COUNTRY,
  isValidCountryCode,
} from "@/lib/countries";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatDisplayTitle, formatTechText } from "@/lib/utils/formatting";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Map popular keywords to specific filters for precise results
const POPULAR_SEARCH_CONFIG = [
  {
    label: "32GB DDR5 RAM",
    category: "ram",
    params: { technology: "DDR5", minCapacity: "32", maxCapacity: "32" },
  },
  {
    label: "DDR4 16GB",
    category: "ram",
    params: { technology: "DDR4", minCapacity: "16", maxCapacity: "16" },
  },
  {
    label: "2TB NVMe SSD",
    category: "ssds",
    params: {
      technology: "SSD",
      formFactor: "M.2 NVMe",
      minCapacity: "2",
      maxCapacity: "2",
    },
  },
  {
    label: "Samsung 990 Pro",
    category: "ssds",
    params: { search: "990 Pro" },
  },
  {
    label: "Crucial P310",
    category: "ssds",
    params: { search: "P310" },
  },
  {
    label: "850W Gold PSU",
    category: "power-supplies",
    params: { technology: "80+ Gold", minCapacity: "850", maxCapacity: "850" },
  },
];

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [limit, setLimit] = React.useState(10);
  const debouncedSearch = useDebounce(search, 300);

  const pathSegments = pathname.split("/").filter(Boolean);
  const country = isValidCountryCode(pathSegments[0] || "")
    ? (pathSegments[0] as CountryCode)
    : DEFAULT_COUNTRY;

  React.useEffect(() => {
    const handleResize = () => {
      setLimit(window.innerWidth < 640 ? 6 : 10);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [data, setData] = React.useState<{
    categories: any[];
    products: any[];
  } | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);

  // Live search using native fetch (Server Action) - Replaces TanStack Query to save 23KB
  React.useEffect(() => {
    if (debouncedSearch.length < 2) {
      setData(null);
      return;
    }

    let active = true;
    const fetchResults = async () => {
      setIsFetching(true);
      try {
        const results = await performSearch(debouncedSearch, limit);
        if (active) {
          setData(results);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        if (active) {
          setIsFetching(false);
        }
      }
    };

    fetchResults();
    return () => {
      active = false;
    };
  }, [debouncedSearch, limit]);

  const categories = data?.categories || [];
  const products = data?.products || [];

  // Reset search when modal closes
  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  const handlePopularSearch = (
    categorySlug: string,
    params: Record<string, any>,
  ) => {
    const basePath = getCategoryPath(categorySlug as any);
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });

    const url = `${basePath}?${searchParams.toString()}`;
    handleSelect(url);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className={cn("max-w-[650px] overflow-hidden rounded-2xl")}
      shouldFilter={false}
    >
      <div className="relative">
        <CommandInput
          placeholder="Wonach suchst du?"
          value={search}
          onValueChange={setSearch}
        />
        {isFetching && (
          <div className="absolute top-1/2 right-4 -translate-y-1/2">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      <CommandList
        className={cn(
          "h-[400px] overflow-hidden scroll-smooth [scrollbar-width:none] sm:h-[500px] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <CommandEmpty>Keine Ergebnisse für &quot;{search}&quot;.</CommandEmpty>

        {!search && (
          <>
            <div className={cn("p-4 pb-2")}>
              <h4
                className={cn(
                  "text-muted-foreground mb-3 flex items-center gap-2 px-1 text-base font-semibold tracking-wider uppercase",
                )}
              >
                Beliebte Suchen
              </h4>
              <div className={cn("flex flex-wrap gap-2")}>
                {POPULAR_SEARCH_CONFIG.map(({ label, category, params }) => (
                  <button
                    key={label}
                    onClick={() => handlePopularSearch(category, params)}
                    className={cn(
                      "bg-accent hover:bg-accent/80 text-accent-foreground cursor-pointer rounded-full px-4 py-2 text-base font-medium transition-colors",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <CommandGroup>
              <CommandItem
                onSelect={() =>
                  handleSelect(country === "us" ? "/" : `/${country}`)
                }
                className="cursor-pointer"
              >
                Startseite
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  handleSelect(country === "us" ? "/blog" : `/${country}/blog`)
                }
                className="cursor-pointer"
              >
                Blog & Ratgeber
              </CommandItem>
            </CommandGroup>

            <CommandGroup>
              {(Object.entries(CATEGORY_MANIFEST) as [CategorySlug, any][])
                .filter(([_, c]) => !c.hidden)
                .slice(0, limit === 6 ? 2 : 5)
                .map(([slug, cat]) => (
                  <CommandItem
                    key={slug}
                    onSelect={() =>
                      handleSelect(getCategoryPath(slug as CategorySlug))
                    }
                    className="cursor-pointer"
                  >
                    {formatTechText(cat.name)}
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        )}

        {search && (
          <>
            {/* 1. Category Suggestions (Text-Only) */}
            {categories.length > 0 && (
              <CommandGroup>
                {categories.map((cat) => (
                  <CommandItem
                    key={`jump-${cat.slug}`}
                    value={`jump-${cat.slug}`}
                    onSelect={() =>
                      handleSelect(
                        cat.searchTerm
                          ? `${getCategoryPath(cat.slug as any)}?search=${cat.searchTerm}`
                          : getCategoryPath(cat.slug as any),
                      )
                    }
                    className="cursor-pointer py-3"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-[#2d2d2d]">
                          {formatTechText(cat.name)}
                        </span>
                        {cat.path && (
                          <span className="text-muted-foreground text-[13px]">
                            - in {formatTechText(cat.path)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* 2. Product Results (Text-Only) */}
            {products.length > 0 && (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.slug}
                    value={`product-${product.slug}`}
                    onSelect={() => handleSelect(`/p/${product.slug}`)}
                    className="cursor-pointer py-2.5"
                  >
                    <div className="flex w-full items-baseline gap-2 truncate">
                      <span className="truncate font-semibold text-[#2d2d2d]">
                        {formatDisplayTitle(product.title)}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-[12px]">
                        - in {formatTechText(product.categoryName)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
