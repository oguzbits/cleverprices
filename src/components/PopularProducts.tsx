"use client";

import { ProductSection } from "@/components/ProductSection";
import { Product } from "@/types";
import { parseAsString, useQueryState } from "nuqs";

interface PopularProductsProps {
  products: Product[];
  country: string;
  priorityIndices?: number[];
}

export function PopularProducts({
  products,
  country,
  priorityIndices,
}: PopularProductsProps) {
  const [category, setCategory] = useQueryState(
    "popularCategory",
    parseAsString.withDefault("all"),
  );

  const categories = [
    { label: "All Products", value: "all" },
    { label: "Hard Drives", value: "hard-drives" },
    { label: "RAM", value: "ram" },
    { label: "Power Supplies", value: "power-supplies" },
  ];

  return (
    <ProductSection
      title="Popular Products"
      description="The most-viewed products right now, analyzed and compared for total value."
      products={products}
      country={country}
      categories={categories}
      selectedCategory={category}
      onCategoryChange={setCategory}
      priorityIndices={priorityIndices}
    />
  );
}
