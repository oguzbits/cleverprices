"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Route Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-4 text-center">
      <div className="bg-destructive/10 text-destructive mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">
        Ups! Da ist etwas schiefgelaufen
      </h2>
      <p className="text-muted-foreground mt-2 mb-8 max-w-[450px]">
        Wir konnten diese Seite leider nicht laden. Dies kann an einem
        vorübergehenden technischen Problem liegen.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={() => reset()} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Erneut versuchen
        </Button>
        <Button variant="outline" asChild>
          <a href="/">Zur Startseite</a>
        </Button>
      </div>
      {error.digest && (
        <p className="text-muted-foreground mt-8 font-mono text-xs">
          Fehler-ID: {error.digest}
        </p>
      )}
    </div>
  );
}
