import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function PromoBanner() {
  return (
    <div className="relative z-60 flex w-full items-center justify-center gap-3 overflow-hidden border-b border-white/10 bg-linear-to-r from-[#e52a00] via-[#ff6200] to-[#ff9a03] px-4 py-2.5 text-center text-white shadow-lg">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-size-[16px_16px] opacity-10"></div>
      <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-white/10 blur-xl"></div>
      <div className="absolute -right-4 -bottom-4 h-12 w-12 rounded-full bg-white/10 blur-xl"></div>

      <div className="relative z-10 flex items-center gap-2">
        <Sparkles className="hidden h-4 w-4 animate-pulse text-white/90 sm:block" />
        <p className="text-base font-bold tracking-tight drop-shadow-sm">
          <span className="hidden sm:inline">Holiday Savings: </span>
          Compare real-time deals and save big! 🎁
        </p>
      </div>

      <Link
        href="https://amzn.to/4aZGtec"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary group relative z-10 ml-1 flex items-center gap-1.5 rounded-full border border-white bg-white px-3.5 py-1.5 text-sm font-black shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all hover:bg-white/95 active:scale-95 sm:ml-4 sm:text-sm"
      >
        EXPLORE DEALS
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
