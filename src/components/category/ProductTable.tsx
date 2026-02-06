import { SortableTableHead } from "@/components/category/SortableTableHead";
import { Badge } from "@/components/ui/badge";
import { getAffiliateRedirectPath } from "@/lib/affiliate-utils";
import { DEFAULT_COUNTRY, type CountryCode } from "@/lib/countries";
import { LocalizedProduct } from "@/lib/server/category-products";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPricePerUnit } from "@/lib/utils/formatting";
import Link from "next/link";

interface ProductTableProps {
  products: LocalizedProduct[];
  unitLabel: string;
  categorySlug: string;
  countryCode: CountryCode;
  sortBy: string;
  sortOrder: string;
}

export function ProductTable({
  products,
  unitLabel,
  categorySlug,
  countryCode,
  sortBy,
  sortOrder,
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
              className="text-foreground hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-primary h-10 w-[100px] cursor-pointer px-2 text-left align-middle font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-inset sm:w-[140px]"
            >
              Price/{unitLabel}
            </SortableTableHead>
            <SortableTableHead
              sortKey="price"
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              className="text-foreground hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-primary hidden h-10 cursor-pointer px-2 pr-4 text-left align-middle font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-inset sm:table-cell sm:pr-12"
            >
              Price
            </SortableTableHead>
            <SortableTableHead
              sortKey="capacity"
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              className="text-foreground hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-primary hidden h-10 cursor-pointer px-2 text-left align-middle font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-inset sm:table-cell"
            >
              Capacity
            </SortableTableHead>
            <th className="text-foreground h-10 min-w-[120px] px-2 text-left align-middle font-medium whitespace-nowrap sm:min-w-[200px]">
              Product
            </th>

            <th className="text-foreground hidden h-10 px-2 text-left align-middle font-medium whitespace-nowrap sm:table-cell">
              Form Factor
            </th>
            <th className="text-foreground hidden h-10 px-2 text-left align-middle font-medium whitespace-nowrap sm:table-cell">
              Technology
            </th>
            <th className="text-foreground hidden h-10 px-2 text-left align-middle font-medium whitespace-nowrap sm:table-cell">
              Condition
            </th>
            <th className="text-foreground h-10 px-2 text-right align-middle font-medium whitespace-nowrap sm:px-4">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {products.map((product) => (
            <tr
              key={product.id || product.slug}
              className="hover:bg-muted/30 data-[state=selected]:bg-muted group border-b transition-colors"
            >
              <td className="text-foreground p-2 align-middle font-mono text-[13px] font-bold whitespace-nowrap sm:text-base">
                {formatPricePerUnit(
                  product.pricePerUnit || 0,
                  unitLabel,
                  countryCode,
                )}
              </td>
              <td className="text-muted-foreground hidden p-2 pr-4 align-middle font-mono whitespace-nowrap sm:table-cell sm:pr-12">
                {formatCurrency(product.price, countryCode)}
              </td>
              <td className="text-muted-foreground hidden p-2 align-middle font-mono whitespace-nowrap sm:table-cell">
                {product.capacity} {product.capacityUnit}
              </td>
              <td className="max-w-0 p-2 align-middle sm:max-w-none">
                <div className="flex flex-col">
                  <Link
                    href={
                      countryCode === DEFAULT_COUNTRY
                        ? `/p/${product.slug}`
                        : `/${countryCode}/p/${product.slug}`
                    }
                    className="text-primary line-clamp-2 block text-sm leading-snug font-medium hover:underline sm:text-base"
                  >
                    {product.title}
                  </Link>
                  <div className="text-muted-foreground mt-1 flex items-center gap-1.5 font-mono text-[10px] sm:hidden">
                    <span>{formatCurrency(product.price, countryCode)}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span>
                      {product.capacity} {product.capacityUnit}
                    </span>
                  </div>
                </div>
              </td>

              <td className="text-muted-foreground hidden p-2 align-middle text-sm whitespace-nowrap sm:table-cell">
                {product.formFactor}
              </td>
              <td className="text-muted-foreground hidden p-2 align-middle text-sm whitespace-nowrap sm:table-cell">
                {product.technology}
              </td>
              <td className="hidden p-2 align-middle whitespace-nowrap sm:table-cell">
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
              <td className="p-2 px-2 text-right align-middle whitespace-nowrap sm:px-4">
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
