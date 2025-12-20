"use client";

import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface CountryItemProps {
  flag: string;
  name: string;
  domain: string;
  isLive: boolean;
  isActive?: boolean;
}

export function CountryItem({
  flag,
  name,
  domain,
  isLive,
  isActive
}: CountryItemProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{flag}</span>
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{domain}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isLive ? (
          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            Live
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Soon
          </Badge>
        )}
        {isActive && (
          <Check className="h-4 w-4 text-primary" />
        )}
      </div>
    </div>
  );
}
