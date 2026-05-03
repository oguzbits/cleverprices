/**
 * Idealo Wishlist Heart Component
 *
 * Heart button for wishlist functionality, matching Idealo's exact SVG.
 *
 * Classes from Idealo:
 * - wishlistHeart
 * - sr-wishlistHeart__button_i5_o7
 */

"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface IdealoWishlistHeartProps {
  /** Product ID for wishlist */
  productId: string;
  /** Whether already in wishlist */
  isActive?: boolean;
  /** Additional className */
  className?: string;
}

export function IdealoWishlistHeart({
  productId,
  isActive = false,
  className,
}: IdealoWishlistHeartProps) {
  const [active, setActive] = useState(isActive);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(!active);
    // TODO: Implement actual wishlist logic
  };

  return (
    <span className={cn("wishlistHeart", className)}>
      <span
        role="button"
        tabIndex={0}
        className={cn(
          "sr-wishlistHeart__button",
          "flex h-6 w-6 cursor-pointer items-center justify-center",
          "rounded-full",
          active
            ? "text-[#e11d48]" // Red when active
            : "text-[#b4b4b4]",
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
        data-wishlist-heart={JSON.stringify({ id: productId, type: "PRODUCT" })}
        data-wishlist-heart-active={active}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 0 : 1.5}
          className="h-5 w-5"
        >
          <path d="M21.317,3.761a5.581,5.581,0,0,0-8.14,0L12,4.994l-1.177-1.23a5.581,5.581,0,0,0-8.14,0,6.211,6.211,0,0,0,0,8.5L3.862,13.5v0L12,22h0l8.138-8.5v0l1.177-1.23A6.211,6.211,0,0,0,21.317,3.761Z" />
        </svg>
      </span>
    </span>
  );
}
