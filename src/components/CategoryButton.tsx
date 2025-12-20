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
  showExplore = false
}: CategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left group cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20' 
          : 'border-border bg-secondary/50 hover:border-primary/20 hover:bg-secondary/70'
      }`}
      aria-label={`Navigate to ${name} category`}
    >
      <div className="p-2.5 rounded-xl bg-background border border-border group-hover:border-primary/20 transition-colors">
        <IconComponent className="h-5 w-5 shrink-0 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm md:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </p>
        {showExplore && (
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
            Category
          </p>
        )}
      </div>
      {showExplore && (
        <Badge variant="outline" className="ml-auto shrink-0 border-border/50 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-all text-[10px] px-2 py-0.5 rounded-full">
          Explore
        </Badge>
      )}
    </button>
  );
}
