"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description: string;
  href: string;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
  canScrollLeft?: boolean;
  canScrollRight?: boolean;
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
  canScrollLeft = false,
  canScrollRight = false,
  categories,
  selectedCategory,
  onCategoryChange,
}: SectionHeaderProps) {
  return (
    <div className="border-border/50 mb-6 border-b pb-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <Link
            href={href}
            className="group inline-flex items-center no-underline"
          >
            <h2 className="text-primary text-2xl leading-tight font-bold tracking-tight decoration-2 underline-offset-4 group-hover:underline">
              {title} →
            </h2>
          </Link>
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-end">
          {categories && onCategoryChange && (
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="bg-secondary/50 border-border/60 ring-offset-background hover:bg-secondary/70 hover:border-primary/30 h-9 w-[160px] rounded-xl text-sm font-bold transition-all">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="border-border/60 rounded-xl">
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.value}
                    value={cat.value}
                    className="rounded-lg text-sm font-medium"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="ml-1 flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={onScrollLeft}
              className={cn(
                "bg-secondary/50 border-border/60 hover:bg-secondary/70 hover:text-primary hover:border-primary/20 h-9 w-9 rounded-xl transition-all active:scale-95",
                !canScrollLeft && "pointer-events-none scale-90 opacity-0",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onScrollRight}
              className={cn(
                "bg-secondary/50 border-border/60 hover:bg-secondary/70 hover:text-primary hover:border-primary/20 h-9 w-9 rounded-xl transition-all active:scale-95",
                !canScrollRight && "pointer-events-none scale-90 opacity-0",
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
