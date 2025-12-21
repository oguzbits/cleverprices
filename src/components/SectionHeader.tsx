"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SectionHeaderProps {
  title: string;
  description: string;
  href: string;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
  categories?: { label: string; value: string }[];
  selectedCategory?: string;
  onCategoryChange?: (value: string) => void;
}

export function SectionHeader({
  title,
  description,
  href,
  onScrollLeft,
  onScrollRight,
  categories,
  selectedCategory,
  onCategoryChange
}: SectionHeaderProps) {
  return (
    <div className="mb-6 border-b border-border/50 pb-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1 space-y-1">
          <Link href={href} className="group inline-flex items-center no-underline">
            <h2 className="text-2xl font-bold tracking-tight text-primary leading-tight group-hover:underline decoration-2 underline-offset-4">
              {title} →
            </h2>
          </Link>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-end">
          {categories && onCategoryChange && (
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[160px] h-9 bg-secondary/50 border-border/60 rounded-xl text-xs font-bold ring-offset-background transition-all hover:bg-secondary/70 hover:border-primary/30">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs font-medium rounded-lg">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-1.5 ml-1">
            <Button
              variant="outline"
              size="icon"
              onClick={onScrollLeft}
              className="w-9 h-9 bg-secondary/50 border-border/60 rounded-xl hover:bg-secondary/70 hover:text-primary hover:border-primary/20 transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onScrollRight}
              className="w-9 h-9 bg-secondary/50 border-border/60 rounded-xl hover:bg-secondary/70 hover:text-primary hover:border-primary/20 transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
