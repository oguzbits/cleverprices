import Link from "next/link";

interface LogoProps {
  country?: string;
  className?: string;
}

export function Logo({ country = "us", className = "" }: LogoProps) {
  const href = country === "us" ? "/" : `/${country}`;

  return (
    <Link
      href={href}
      className={`flex items-center no-underline ${className}`}
      title="Amazon Price Per Unit Tracker, Storage Deals & True Value"
      aria-label="CleverPrices Home - Amazon Price Per Unit Tracker"
      prefetch={true}
    >
      <div className="relative">
        <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          cleverprices
        </span>
        {/* Orange underline accent */}
        <div
          className="absolute right-0 -bottom-1.5 left-0 h-[3px]"
          style={{ backgroundColor: "var(--ccc-orange)" }}
        />
      </div>
    </Link>
  );
}
