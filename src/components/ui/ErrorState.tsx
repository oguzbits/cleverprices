"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Etwas ist schiefgelaufen",
  message = "Es gab einen Fehler beim Laden der Daten. Bitte versuchen Sie es erneut.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg bg-red-50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 text-red-500">
        <AlertTriangle className="h-12 w-12" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[#2d2d2d]">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-[#666]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </button>
      )}
    </div>
  );
}
