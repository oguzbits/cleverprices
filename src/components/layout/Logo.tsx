import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("flex items-center no-underline", className)}
      title="Amazon Price Per Unit Tracker, Storage Deals & True Value"
      aria-label="CleverPrices Home - Amazon Price Per Unit Tracker"
      prefetch={true}
    >
      <div className="border-b-[3px] border-(--ccc-orange) pb-0.5">
        <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          cleverprices
        </span>
      </div>
    </Link>
  );
}
