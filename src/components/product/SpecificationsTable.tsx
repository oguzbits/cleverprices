/**
 * Specifications Table
 *
 * Displays full product specifications in a clean table format.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/lib/product-registry";

interface SpecificationsTableProps {
  product: Product;
}

export function SpecificationsTable({ product }: SpecificationsTableProps) {
  // Build specifications array from product data
  const specs: { label: string; value: string | undefined }[] = [
    { label: "Brand", value: product.brand },
    { label: "Capacity", value: `${product.capacity} ${product.capacityUnit}` },
    { label: "Form Factor", value: product.formFactor },
    { label: "Technology", value: product.technology },
    { label: "Condition", value: product.condition },
    { label: "Warranty", value: product.warranty },
    { label: "Certification", value: product.certification },
    { label: "Modularity", value: product.modularityTyp },
  ].filter((spec) => spec.value); // Remove empty values

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <tbody>
            {specs.map((spec, index) => (
              <tr
                key={spec.label}
                className={index % 2 === 0 ? "bg-muted/30" : "bg-background"}
              >
                <td className="text-muted-foreground w-1/3 px-4 py-3 text-sm font-medium">
                  {spec.label}
                </td>
                <td className="text-foreground px-4 py-3 text-sm">
                  {spec.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
