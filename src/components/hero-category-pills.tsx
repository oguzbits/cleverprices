"use client";

import Link from "next/link";
import { HardDrive, MemoryStick, Zap } from "lucide-react";
import { getCategoryPath } from "@/lib/categories";
import { useCountry } from "@/hooks/use-country";

const categories = [
  { name: "Hard Drives & SSDs", icon: HardDrive, slug: "hard-drives" },
  { name: "RAM & Memory", icon: MemoryStick, slug: "ram" },
  { name: "Power Supplies", icon: Zap, slug: "power-supplies" },
];

export function HeroCategoryPills() {
  const { country } = useCountry();

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-muted-foreground self-center text-base">
        Popular:
      </span>
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link
            key={category.slug}
            href={getCategoryPath(category.slug, country)}
            className="group border-primary/20 bg-secondary hover:bg-secondary/80 flex items-center gap-2 rounded-full border px-4 py-2 no-underline shadow-sm transition-all"
          >
            <Icon className="text-primary h-3.5 w-3.5" />
            <span className="text-primary text-base font-bold transition-colors group-hover:underline">
              {category.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
