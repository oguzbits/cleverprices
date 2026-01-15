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
import {
  allCategories,
  getCategoryPath,
  type CategorySlug,
} from "@/lib/categories";
import {
  CountryCode,
  DEFAULT_COUNTRY,
  isValidCountryCode,
} from "@/lib/countries";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDisplayTitle } from "@/lib/utils/formatting";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Home,
  LayoutGrid,
  Loader2,
  Package,
  Search,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
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
    category: "hard-drives",
    params: {
      technology: "SSD",
      formFactor: "M.2 NVMe",
      minCapacity: "2",
      maxCapacity: "2",
    },
  },
  {
    label: "Samsung 990 Pro",
    category: "hard-drives",
    params: { search: "990 Pro" },
  },
  {
    label: "Crucial P310",
    category: "hard-drives",
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
  const debouncedSearch = useDebounce(search, 300);

  const pathSegments = pathname.split("/").filter(Boolean);
  const country = isValidCountryCode(pathSegments[0] || "")
    ? (pathSegments[0] as CountryCode)
    : DEFAULT_COUNTRY;

  // Live product search using TanStack Query + Server Action
  const { data: products, isFetching } = useQuery({
    queryKey: ["product-search", debouncedSearch],
    queryFn: () => performSearch(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 60 * 1000,
  });

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

  // Filter categories based on search
  const filteredCategories = React.useMemo(() => {
    if (!search) return Object.values(allCategories).filter((c) => !c.hidden);
    const s = search.toLowerCase();
    return Object.values(allCategories).filter(
      (c) =>
        !c.hidden &&
        (c.name.toLowerCase().includes(s) ||
          c.description.toLowerCase().includes(s)),
    );
  }, [search]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className={cn("max-w-[650px]")}
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

      <CommandList className={cn("min-h-[300px] scroll-smooth")}>
        <CommandEmpty>Keine Ergebnisse für &quot;{search}&quot;.</CommandEmpty>

        {!search && (
          <>
            <div className={cn("p-4 pb-2")}>
              <h4
                className={cn(
                  "text-muted-foreground mb-3 flex items-center gap-2 px-1 text-base font-semibold tracking-wider uppercase",
                )}
              >
                <TrendingUp className={cn("h-5 w-5")} />
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

            <CommandGroup heading="Schnellzugriff">
              <CommandItem
                onSelect={() =>
                  handleSelect(country === "us" ? "/" : `/${country}`)
                }
                className="cursor-pointer"
              >
                <Home className={cn("mr-2 h-4 w-4")} />
                Startseite
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  handleSelect(country === "us" ? "/blog" : `/${country}/blog`)
                }
                className="cursor-pointer"
              >
                <BookOpen className={cn("mr-2 h-4 w-4")} />
                Blog & Ratgeber
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Kategorien">
              {Object.values(allCategories)
                .filter((c) => !c.hidden)
                .map((cat) => (
                  <CommandItem
                    key={cat.slug}
                    onSelect={() => handleSelect(getCategoryPath(cat.slug))}
                    className="cursor-pointer"
                  >
                    <LayoutGrid className={cn("mr-2 h-4 w-4")} />
                    {cat.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        )}

        {search && (
          <>
            {/* Direct Product Results */}
            {products && products.length > 0 && (
              <CommandGroup heading="Produkte">
                {products.map((product) => (
                  <CommandItem
                    key={product.asin}
                    onSelect={() => handleSelect(`/p/${product.slug}`)}
                    className="flex cursor-pointer items-center gap-3 py-3"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-white p-1">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <Package className="text-muted-foreground/20 h-full w-full" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center overflow-hidden">
                      <span className="text-foreground truncate font-medium">
                        {formatDisplayTitle(product.title)}
                      </span>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#ff6600]">
                          ab{" "}
                          {formatCurrency(product.prices[country] || 0, "de")}
                        </span>
                        <span>•</span>
                        <span className="truncate">
                          in{" "}
                          {allCategories[product.category as CategorySlug]
                            ?.name || product.category}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Kategorie-Filter">
              {filteredCategories.slice(0, 5).map((cat) => (
                <CommandItem
                  key={cat.slug}
                  onSelect={() =>
                    handleSelect(
                      `${getCategoryPath(cat.slug)}?search=${encodeURIComponent(search)}`,
                    )
                  }
                  className={cn("cursor-pointer py-3")}
                >
                  <Search className={cn("mr-2 h-4 w-4")} />
                  <div className={cn("flex items-center gap-1.5")}>
                    <span className={cn("font-semibold")}>{search}</span>
                    <span className={cn("text-muted-foreground")}>in</span>
                    <span>{cat.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {filteredCategories.length > 0 && (
              <CommandGroup heading="Zur Kategorie wechseln">
                {filteredCategories.slice(0, 3).map((cat) => (
                  <CommandItem
                    key={`jump-${cat.slug}`}
                    onSelect={() => handleSelect(getCategoryPath(cat.slug))}
                    className="cursor-pointer"
                  >
                    <LayoutGrid className={cn("mr-2 h-4 w-4")} />
                    {cat.name}
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
