"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trackSEO } from "@/lib/analytics";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          onClick={() => {
            const newTheme = theme === "light" ? "dark" : "light";
            setTheme(newTheme);
            // Track theme change for SEO analytics
            trackSEO.themeChanged(newTheme as "light" | "dark");
          }}
          aria-label={
            mounted
              ? `Switch to ${theme === "light" ? "dark" : "light"} mode`
              : "Toggle theme"
          }
        >
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Toggle theme</p>
      </TooltipContent>
    </Tooltip>
  );
}
