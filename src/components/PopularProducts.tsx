"use client";

import React from "react";
import { ProductUIModel } from "@/lib/amazon-api";
import { ProductSection } from "@/components/ProductSection";

interface PopularProductsProps {
  products: ProductUIModel[];
}

export function PopularProducts({ products }: PopularProductsProps) {
  const [category, setCategory] = React.useState("all");

  const categories = [
    { label: "All Products", value: "all" },
    { label: "Hard Drives", value: "hard-drives" },
    { label: "RAM", value: "ram" }
  ];

  return (
    <ProductSection 
      title="Popular Products"
      description="The most-viewed products right now, analyzed and compared for total value."
      products={products}
      categories={categories}
      selectedCategory={category}
      onCategoryChange={setCategory}
    />
  );
}
