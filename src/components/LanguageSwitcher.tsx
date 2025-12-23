import Link from "next/link"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  currentLang: "de" | "en"
  currentPath: "impressum" | "datenschutz"
}

export function LanguageSwitcher({ currentLang, currentPath }: LanguageSwitcherProps) {
  const dePath = `/${currentPath}`
  const enPath = `/en/${currentPath}`

  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="text-base font-medium text-muted-foreground">Language</span>
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
        <Link
          href={dePath}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            currentLang === "de"
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50 hover:text-foreground"
          )}
        >
          Deutsch
        </Link>
        <Link
          href={enPath}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            currentLang === "en"
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50 hover:text-foreground"
          )}
        >
          English
        </Link>
      </div>
    </div>
  )
}
