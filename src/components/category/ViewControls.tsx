"use client";

import { LayoutGrid, List } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ViewControlsProps {
  productCount: number;
  categoryName: string;
}

export function ViewControls({
  productCount: _productCount,
  categoryName: _categoryName,
}: ViewControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = searchParams.get("view") || "grid";
  const currentSort = searchParams.get("sortBy") || "pricePerUnit";
  const currentOrder = searchParams.get("sortOrder") || "asc";

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleView = (view: string) => {
    updateParams("view", view);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Sort Dropdown */}
      <Select
        value={`${currentSort}-${currentOrder}`}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="h-9 w-[180px] border-zinc-200 bg-white text-[13px]">
          <SelectValue placeholder="Sortieren" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pricePerUnit-asc">Preis/Einheit ↑</SelectItem>
          <SelectItem value="pricePerUnit-desc">Preis/Einheit ↓</SelectItem>
          <SelectItem value="price-asc">Preis ↑</SelectItem>
          <SelectItem value="price-desc">Preis ↓</SelectItem>
          <SelectItem value="capacity-asc">Kapazität ↑</SelectItem>
          <SelectItem value="capacity-desc">Kapazität ↓</SelectItem>
        </SelectContent>
      </Select>

      {/* View Toggle Icons - Idealo style */}
      <div className="flex items-center rounded-md border border-zinc-200 bg-white">
        <button
          onClick={() => toggleView("grid")}
          className={cn(
            "flex h-9 w-9 items-center justify-center border-r border-zinc-200 transition-colors",
            currentView === "grid"
              ? "bg-zinc-100 text-[#0066cc]"
              : "text-zinc-400 hover:text-zinc-600",
          )}
          aria-label="Kachelansicht"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => toggleView("list")}
          className={cn(
            "flex h-9 w-9 items-center justify-center transition-colors",
            currentView === "list"
              ? "bg-zinc-100 text-[#0066cc]"
              : "text-zinc-400 hover:text-zinc-600",
          )}
          aria-label="Listenansicht"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
