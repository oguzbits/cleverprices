"use client";

import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface CategoryButtonProps {
  name: string;
  slug: string;
  icon: LucideIcon;
  isSelected?: boolean;
  onClick: () => void;
  showExplore?: boolean;
}

export function CategoryButton({
  name,
  icon: IconComponent,
  isSelected,
  onClick,
  showExplore = false,
}: CategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
        isSelected
          ? "border-primary bg-primary/10 ring-primary/20 shadow-sm ring-1"
          : "border-border bg-secondary/50 hover:border-primary/20 hover:bg-secondary/70"
      }`}
      aria-label={`Navigate to ${name} category`}
    >
      <div className="bg-background border-border group-hover:border-primary/20 rounded-xl border p-2.5 transition-colors">
        <IconComponent className="text-primary h-5 w-5 shrink-0" />
      </div>
      <div className="flex-1">
        <p className="text-foreground group-hover:text-primary text-base font-semibold transition-colors md:text-base">
          {name}
        </p>
        {showExplore && (
          <p className="text-muted-foreground mt-0.5 text-sm font-bold tracking-wider uppercase">
            Category
          </p>
        )}
      </div>
      {showExplore && (
        <Badge
          variant="outline"
          className="border-border/50 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary ml-auto shrink-0 rounded-full px-2 py-0.5 text-sm transition-all"
        >
          Explore
        </Badge>
      )}
    </button>
  );
}
