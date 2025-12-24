"use client";

import React from "react";
import { ProductUIModel } from "@/lib/amazon-api";
import { ProductSection } from "@/components/ProductSection";

interface PriceDropsProps {
  products: (ProductUIModel & { dropPercentage: number })[];
}

export function PriceDrops({ products }: PriceDropsProps) {
  const [period, setPeriod] = React.useState<"daily" | "weekly">("daily");
  const [category, setCategory] = React.useState("all");

  const filteredProducts = products
    .map((p) => ({
      ...p,
      discountPercentage: p.dropPercentage,
    }))
    .sort((a, b) =>
      period === "daily"
        ? b.discountPercentage - a.discountPercentage
        : a.discountPercentage - b.discountPercentage,
    );

  const categories = [
    { label: "All Products", value: "all" },
    { label: "Hard Drives", value: "hard-drives" },
    { label: "RAM", value: "ram" },
    { label: "Power Supplies", value: "power-supplies" },
  ];

  return (
    <ProductSection
      title="Top Amazon Price Drops"
      description="The products below have seen significant price drops since the last update. Save big by choosing these vetted deals."
      products={filteredProducts}
      categories={categories}
      selectedCategory={category}
      onCategoryChange={setCategory}
    >
      <div className="-mt-2 mb-6 flex gap-2">
        <button
          onClick={() => setPeriod("daily")}
          className={`cursor-pointer rounded-xl border px-4 py-1.5 text-sm font-bold transition-all duration-300 ${
            period === "daily"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30 hover:bg-secondary/70"
          }`}
        >
          Daily Drops
        </button>
        <button
          onClick={() => setPeriod("weekly")}
          className={`cursor-pointer rounded-xl border px-4 py-1.5 text-sm font-bold transition-all duration-300 ${
            period === "weekly"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30 hover:bg-secondary/70"
          }`}
        >
          Weekly Drops
        </button>
      </div>
    </ProductSection>
  );
}
