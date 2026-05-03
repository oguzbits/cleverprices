"use client";

import { Package } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title = "Keine Produkte gefunden",
  description = "Wir aktualisieren regelmäßig unseren Produktkatalog. Schauen Sie bald wieder vorbei!",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[6px] bg-[#f5f5f5] px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 text-[#999]">
        {icon || <Package className="h-12 w-12" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[#2d2d2d]">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-[#666]">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="rounded-full bg-[#0066cc] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0055aa]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
