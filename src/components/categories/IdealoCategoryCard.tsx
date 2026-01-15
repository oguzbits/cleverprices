/**
 * Idealo Category Card Component
 *
 * Individual category card matching Idealo's design.
 * Displays category image, title with chevron, and popular filter links.
 *
 * Based on Idealo's _categoryGridItem class structure.
 */

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface IdealoCategoryCardProps {
  title: string;
  href: string;
  imageUrl?: string;
  popularLinks?: { title: string; href: string }[];
  className?: string;
}

export function IdealoCategoryCard({
  title,
  href,
  imageUrl,
  popularLinks = [],
  className,
}: IdealoCategoryCardProps) {
  return (
    <div
      className={cn(
        "_categoryGridItem",
        "border-r border-b border-[#e5e5e5]",
        "p-4",
        "bg-white",
        className,
      )}
      data-testid="category-grid-item"
    >
      {/* Main category link with image and title */}
      <Link href={href} className="group block">
        {/* Category Image */}
        {imageUrl && (
          <div className="mb-3 flex justify-center">
            <Image
              src={imageUrl}
              alt={title}
              width={144}
              height={120}
              className="object-contain"
              loading="lazy"
            />
          </div>
        )}

        {/* Title with chevron */}
        <div className="_categoryGridItem__title flex items-center justify-between gap-2">
          <span className="text-[14px] font-semibold text-[#2d2d2d]">
            {title}
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#2d2d2d]" />
        </div>
      </Link>

      {/* Popular links (brand/filter shortcuts) */}
      {popularLinks.length > 0 && (
        <div className="_popularLinks mt-3 flex flex-col gap-1.5">
          {popularLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] leading-tight text-[#2d2d2d] hover:text-[#0066cc] hover:underline"
              title={`${link.title} ${title}`}
            >
              {link.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
