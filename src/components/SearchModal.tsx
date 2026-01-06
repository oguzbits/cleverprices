"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DEFAULT_COUNTRY, isValidCountryCode } from "@/lib/countries";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  FileText,
  Home,
  LayoutGrid,
  Package,
  Search,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  group: string;
  url: string;
  icon?: string;
  meta?: { price?: number; currency?: string };
}

const ICON_MAP: Record<string, typeof Search> = {
  LayoutGrid,
  FileText,
  Package,
  Home,
  BookOpen,
};

const GROUP_ORDER = [
  "Categories",
  "Products",
  "Calculators",
  "Articles",
  "Navigation",
];

// Simple fetch function
const fetchSearchIndex = async (country: string): Promise<SearchItem[]> => {
  const res = await fetch(`/api/search?country=${country}`);
  return res.json();
};

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegments = pathname.split("/").filter(Boolean);
  const country = isValidCountryCode(pathSegments[0] || "")
    ? pathSegments[0]
    : DEFAULT_COUNTRY;

  // React Query handles caching automatically
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["search", country],
    queryFn: () => fetchSearchIndex(country),
    enabled: open, // Only fetch when modal is open
  });

  // Group items by category
  const groupedItems = items.reduce<Record<string, SearchItem[]>>(
    (acc, item) => {
      (acc[item.group] ??= []).push(item);
      return acc;
    },
    {},
  );

  // Navigate and close modal
  const handleSelect = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search for products, categories, or guides..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {isLoading && (
          <div className="text-muted-foreground p-4 text-center text-sm">
            Loading...
          </div>
        )}
        {!isLoading &&
          GROUP_ORDER.map((group) => {
            const groupItems = groupedItems[group];
            if (!groupItems?.length) return null;

            return (
              <div key={group}>
                <CommandGroup heading={group}>
                  {groupItems.map((item) => {
                    const Icon = (item.icon && ICON_MAP[item.icon]) || Search;
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${item.title} ${item.description || ""} ${item.group} ${item.url}`}
                        onSelect={() => handleSelect(item.url)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-base">{item.title}</span>
                          {item.description && (
                            <span className="text-muted-foreground text-xs">
                              {item.description}
                            </span>
                          )}
                        </div>
                        {item.meta?.price && (
                          <span className="text-muted-foreground ml-auto font-medium">
                            {new Intl.NumberFormat(undefined, {
                              style: "currency",
                              currency: item.meta.currency || "USD",
                            }).format(item.meta.price)}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </div>
            );
          })}
      </CommandList>
    </CommandDialog>
  );
}

// Prefetch function for hover
export const prefetchSearchIndex = (country: string = DEFAULT_COUNTRY) => {
  fetch(`/api/search?country=${country}`).catch(() => {});
};
