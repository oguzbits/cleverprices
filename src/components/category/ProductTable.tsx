import * as React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
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
    const effectiveSortBy = !sortBy ? 'pricePerUnit' : sortBy;
    if (effectiveSortBy !== key) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="ml-1 h-3 w-3" />
      : <ChevronDown className="ml-1 h-3 w-3" />;
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort(key);
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" 
              onClick={() => onSort('pricePerUnit')}
              onKeyDown={(e) => handleKeyDown(e, 'pricePerUnit')}
              tabIndex={0}
              aria-sort={sortBy === 'pricePerUnit' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              role="columnheader"
            >
              <div className="flex items-center">Price/{unitLabel} {getSortIcon('pricePerUnit')}</div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" 
              onClick={() => onSort('price')}
              onKeyDown={(e) => handleKeyDown(e, 'price')}
              tabIndex={0}
              aria-sort={sortBy === 'price' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              role="columnheader"
            >
              <div className="flex items-center">Price {getSortIcon('price')}</div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" 
              onClick={() => onSort('capacity')}
              onKeyDown={(e) => handleKeyDown(e, 'capacity')}
              tabIndex={0}
              aria-sort={sortBy === 'capacity' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              role="columnheader"
            >
              <div className="flex items-center">Capacity {getSortIcon('capacity')}</div>
            </TableHead>
            <TableHead className="hidden md:table-cell">Warranty</TableHead>
            <TableHead className="hidden sm:table-cell">Form Factor</TableHead>
            <TableHead className="hidden sm:table-cell">
              {categorySlug === 'power-supplies' ? 'Certification' : 'Technology'}
            </TableHead>
            <TableHead className="hidden sm:table-cell">Condition</TableHead>
            <TableHead>Product</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id || product.slug} className="group">
              <TableCell className="font-medium">
                {formatCurrency(product.pricePerUnit || 0, 3)}
              </TableCell>
              <TableCell>
                {formatCurrency(product.price)}
              </TableCell>
              <TableCell>
                {product.capacity} {product.capacityUnit}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-base">
                {product.warranty}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-base">
                {product.formFactor}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-base">
                {categorySlug === 'power-supplies' 
                  ? (product.certification || product.technology) 
                  : product.technology}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge 
                  className={cn(
                    "text-sm font-medium border-0 px-2 py-0.5",
                    product.condition === 'New' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30",
                    product.condition === 'Renewed' && "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30",
                    product.condition === 'Used' && "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30"
                  )}
                >
                  {product.condition}
                </Badge>
              </TableCell>
              <TableCell>
                <a 
                  href={getAffiliateRedirectPath(product.slug)}
                  onClick={() => onAffiliateClick(product, index)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline text-base line-clamp-2 block"
                >
                  {product.title}
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
