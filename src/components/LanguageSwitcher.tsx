import Link from "next/link";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  currentLang: "de" | "en";
  currentPath: "impressum" | "datenschutz";
}

export function LanguageSwitcher({
  currentLang,
  currentPath,
}: LanguageSwitcherProps) {
  const dePath = `/${currentPath}`;
  const enPath = `/en/${currentPath}`;

  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="text-muted-foreground text-base font-medium">
        Language
      </span>
      <div className="bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1">
        <Link
          href={dePath}
          className={cn(
            "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-md px-3 py-1 text-base font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
            currentLang === "de"
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50 hover:text-foreground",
          )}
        >
          Deutsch
        </Link>
        <Link
          href={enPath}
          className={cn(
            "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-md px-3 py-1 text-base font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
            currentLang === "en"
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50 hover:text-foreground",
          )}
        >
          English
        </Link>
      </div>
    </div>
  );
}
