import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function PromoBanner() {
  return (
    <div className="w-full relative overflow-hidden bg-linear-to-r from-[#e52a00] via-[#ff6200] to-[#ff9a03] py-2.5 px-4 flex items-center justify-center gap-3 text-white text-center shadow-lg border-b border-white/10 z-60">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-size-[16px_16px]"></div>
      <div className="absolute -left-4 -top-4 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>

      <div className="flex items-center gap-2 relative z-10">
        <Sparkles className="w-4 h-4 text-white/90 animate-pulse hidden sm:block" />
        <p className="text-base font-bold tracking-tight drop-shadow-sm">
          <span className="hidden sm:inline">Holiday Savings: </span>
          Compare real-time deals and save big! 🎁
        </p>
      </div>

      <Link 
        href="https://amzn.to/4aZGtec"
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 flex items-center gap-1.5 text-sm sm:text-sm font-black bg-white text-primary hover:bg-white/95 px-3.5 py-1.5 rounded-full transition-all border border-white ml-1 sm:ml-4 group active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
      >
        EXPLORE DEALS
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
