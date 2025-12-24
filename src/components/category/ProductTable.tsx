import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ChevronsUpDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Product, getAffiliateRedirectPath } from "@/lib/product-registry";

interface ProductTableProps {
  products: Product[];
  unitLabel: string;
  categorySlug: string;
  sortBy: string;
  sortOrder: string;
  onSort: (key: string) => void;
  formatCurrency: (value: number, fractionDigits?: number) => string;
  onAffiliateClick: (product: Product, index: number) => void;
}

export function ProductTable({
  products,
  unitLabel,
  categorySlug,
  sortBy,
  sortOrder,
  onSort,
  formatCurrency,
  onAffiliateClick,
}: ProductTableProps) {
  const getSortIcon = (key: string) => {
    const effectiveSortBy = !sortBy ? "pricePerUnit" : sortBy;
    if (effectiveSortBy !== key)
      return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSort(key);
    }
  };

  return (
    <div className="bg-card rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-primary w-[140px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset"
              onClick={() => onSort("pricePerUnit")}
              onKeyDown={(e) => handleKeyDown(e, "pricePerUnit")}
              tabIndex={0}
              aria-sort={
                sortBy === "pricePerUnit"
                  ? sortOrder === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
              role="columnheader"
            >
              <div className="flex items-center gap-1.5">
                <span>Price/{unitLabel}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground/70 hover:text-foreground h-3.5 w-3.5 cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="max-w-[200px]"
                  >
                    This is the calculated price per {unitLabel} of capacity,
                    allowing you to easily compare value across different sizes.
                  </TooltipContent>
                </Tooltip>
                {getSortIcon("pricePerUnit")}
              </div>
            </TableHead>
            <TableHead className="min-w-[200px]">Product</TableHead>
            <TableHead
              className="hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-primary cursor-pointer pr-12 outline-none focus-visible:ring-2 focus-visible:ring-inset"
              onClick={() => onSort("price")}
              onKeyDown={(e) => handleKeyDown(e, "price")}
              tabIndex={0}
              aria-sort={
                sortBy === "price"
                  ? sortOrder === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
              role="columnheader"
            >
              <div className="flex items-center">
                Price {getSortIcon("price")}
              </div>
            </TableHead>
            <TableHead
              className="hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-primary cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset"
              onClick={() => onSort("capacity")}
              onKeyDown={(e) => handleKeyDown(e, "capacity")}
              tabIndex={0}
              aria-sort={
                sortBy === "capacity"
                  ? sortOrder === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
              role="columnheader"
            >
              <div className="flex items-center">
                Capacity {getSortIcon("capacity")}
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell">Warranty</TableHead>
            <TableHead className="hidden sm:table-cell">Form Factor</TableHead>
            <TableHead className="hidden sm:table-cell">
              {categorySlug === "power-supplies"
                ? "Certification"
                : "Technology"}
            </TableHead>
            <TableHead className="hidden sm:table-cell">Condition</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow
              key={product.id || product.slug}
              className="group hover:bg-muted/30 transition-colors"
            >
              <TableCell className="text-foreground font-mono font-bold">
                {formatCurrency(product.pricePerUnit || 0, 3)}
              </TableCell>
              <TableCell>
                <a
                  href={getAffiliateRedirectPath(product.slug)}
                  onClick={() => onAffiliateClick(product, index)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary line-clamp-2 block text-base leading-snug font-medium hover:underline"
                >
                  {product.title}
                </a>
              </TableCell>
              <TableCell className="text-muted-foreground pr-12 font-mono whitespace-nowrap">
                {formatCurrency(product.price)}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono">
                {product.capacity} {product.capacityUnit}
              </TableCell>

              <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                {product.warranty}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                {product.formFactor}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                {categorySlug === "power-supplies"
                  ? product.certification || product.technology
                  : product.technology}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-0 px-2 py-0 text-xs font-semibold shadow-none",
                    product.condition === "New" &&
                      "bg-emerald-100/50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
                    product.condition === "Renewed" &&
                      "bg-blue-100/50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300",
                    product.condition === "Used" &&
                      "bg-amber-100/50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
                  )}
                >
                  {product.condition}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <a
                  href={getAffiliateRedirectPath(product.slug)}
                  onClick={() => onAffiliateClick(product, index)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <button className="h-9 cursor-pointer rounded-xl border border-[#FCD200]/50 bg-[#FFD814] px-4 text-sm font-bold whitespace-nowrap text-black shadow-sm transition-all hover:bg-[#F7CA00] active:scale-[0.98]">
                    View Deal
                  </button>
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
