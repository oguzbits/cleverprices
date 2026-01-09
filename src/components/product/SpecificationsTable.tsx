/**
 * Specifications Table
 *
 * Displays full product specifications in a clean table format.
 */

import { Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";

interface SpecificationsTableProps {
  product: Product;
}

export function SpecificationsTable({ product }: SpecificationsTableProps) {
  // Build specifications array from product data (German labels to match Idealo)
  const specs: { label: string; value: string | undefined }[] = [
    { label: "Marke", value: product.brand },
    {
      label: "Speicherkapazität",
      value: `${product.capacity} ${product.capacityUnit}`,
    },
    { label: "Formfaktor", value: product.formFactor },
    { label: "Zustand", value: product.condition },
    { label: "Garantie", value: product.warranty },
  ].filter((spec) => spec.value); // Remove empty values

  return (
    <ul className="datasheet-list w-full text-sm">
      {specs.map((spec) => (
        <li
          key={spec.label}
          className={cn(
            "datasheet-listItem flex w-full border-b border-[#f5f5f5] py-2",
            "last:border-0",
          )}
        >
          <span className="datasheet-listItemKey w-[35%] shrink-0 text-[#767676] md:w-[40%]">
            {spec.label}
          </span>
          <span className="datasheet-listItemValue flex-1 text-[#2d2d2d]">
            {spec.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
