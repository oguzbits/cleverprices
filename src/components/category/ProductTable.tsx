import { SortableTableHead } from "@/components/category/SortableTableHead";
import { Badge } from "@/components/ui/badge";
import { getAffiliateRedirectPath } from "@/lib/affiliate-utils";
import { LocalizedProduct } from "@/lib/server/category-products";
import { cn } from "@/lib/utils";

interface ProductTableProps {
  products: LocalizedProduct[];
  unitLabel: string;
  categorySlug: string;
  sortBy: string;
  sortOrder: string;
  formatCurrency: (value: number, fractionDigits?: number) => string;
}

export function ProductTable({
  products,
  unitLabel,
  categorySlug,
  sortBy,
  sortOrder,
  formatCurrency,
}: ProductTableProps) {
  return (
    <div className="bg-card w-full overflow-x-auto rounded-md border">
      <table className="w-full caption-bottom text-base">
        <thead className="[&_tr]:border-b">
          <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
            <SortableTableHead
              sortKey="pricePerUnit"
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-primary w-[100px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset sm:w-[140px]"
            >
              Price/{unitLabel}
            </SortableTableHead>
            <SortableTableHead
              sortKey="price"
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-primary hidden cursor-pointer pr-4 outline-none focus-visible:ring-2 focus-visible:ring-inset sm:table-cell sm:pr-12"
            >
              Price
            </SortableTableHead>
            <SortableTableHead
              sortKey="capacity"
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-primary hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset sm:table-cell"
            >
              Capacity
            </SortableTableHead>
            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap min-w-[120px] sm:min-w-[200px]">Product</th>
            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap hidden md:table-cell">Warranty</th>
            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap hidden sm:table-cell">Form Factor</th>
            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap hidden sm:table-cell">
              {categorySlug === "power-supplies"
                ? "Certification"
                : "Technology"}
            </th>
            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap hidden sm:table-cell">Condition</th>
            <th className="text-foreground h-10 px-2 text-right align-middle font-medium whitespace-nowrap sm:px-4">Action</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {products.map((product) => (
            <tr
              key={product.id || product.slug}
              className="hover:bg-muted/30 data-[state=selected]:bg-muted border-b transition-colors group"
            >
              <td className="p-2 align-middle whitespace-nowrap text-foreground font-mono text-[13px] font-bold sm:text-base">
                {formatCurrency(product.pricePerUnit || 0, 2)}
              </td>
              <td className="p-2 align-middle whitespace-nowrap text-muted-foreground hidden pr-4 font-mono sm:table-cell sm:pr-12">
                {formatCurrency(product.price)}
              </td>
              <td className="p-2 align-middle whitespace-nowrap text-muted-foreground hidden font-mono sm:table-cell">
                {product.capacity} {product.capacityUnit}
              </td>
              <td className="p-2 align-middle max-w-0 sm:max-w-none">
                <div className="flex flex-col">
                  <a
                    href={getAffiliateRedirectPath(product.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary line-clamp-2 block text-sm leading-snug font-medium hover:underline sm:text-base"
                  >
                    {product.title}
                  </a>
                  <div className="text-muted-foreground mt-1 flex items-center gap-1.5 font-mono text-[10px] sm:hidden">
                    <span>{formatCurrency(product.price)}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span>
                      {product.capacity} {product.capacityUnit}
                    </span>
                  </div>
                </div>
              </td>

              <td className="p-2 align-middle whitespace-nowrap text-muted-foreground hidden text-sm md:table-cell">
                {product.warranty}
              </td>
              <td className="p-2 align-middle whitespace-nowrap text-muted-foreground hidden text-sm sm:table-cell">
                {product.formFactor}
              </td>
              <td className="p-2 align-middle whitespace-nowrap text-muted-foreground hidden text-sm sm:table-cell">
                {categorySlug === "power-supplies"
                  ? product.certification || product.technology
                  : product.technology}
              </td>
              <td className="p-2 align-middle whitespace-nowrap hidden sm:table-cell">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-0 px-2 py-0 text-xs font-semibold shadow-none",
                    product.condition === "New" &&
                      "bg-emerald-100/50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
                    product.condition === "Renewed" &&
                      "bg-secondary text-secondary-foreground",
                    product.condition === "Used" &&
                      "bg-amber-100/50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
                  )}
                >
                  {product.condition}
                </Badge>
              </td>
              <td className="p-2 align-middle whitespace-nowrap px-2 text-right sm:px-4">
                <a
                  href={getAffiliateRedirectPath(product.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <button className="h-8 cursor-pointer rounded-lg border border-[#FCD200]/50 bg-[#FFD814] px-3 text-[11px] font-bold whitespace-nowrap text-black shadow-sm transition-all hover:bg-[#F7CA00] active:scale-[0.98] sm:h-9 sm:rounded-xl sm:px-4 sm:text-sm">
                    <span className="sm:hidden">View</span>
                    <span className="hidden sm:inline">View on Amazon</span>
                  </button>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
