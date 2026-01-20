"use client";

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function amazonImageLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderParams): string {
  // If it's not an Amazon image, return as is
  if (
    !src.includes("m.media-amazon.com") &&
    !src.includes("images-na.ssl-images-amazon.com")
  ) {
    return src;
  }

  // Handle Amazon URLs
  // Pattern: https://m.media-amazon.com/images/I/71Wj+Zc7cZL._AC_SL1500_.jpg
  // SX{width} sets the width in pixels.
  // QL{quality} sets the compression level (1-100).

  try {
    const url = new URL(src);
    const pathname = url.pathname;

    // Split extension
    const lastDotIndex = pathname.lastIndexOf(".");
    if (lastDotIndex === -1) return src;

    const extension = pathname.substring(lastDotIndex);
    const basePart = pathname.substring(0, lastDotIndex);

    // Strip existing modifiers like ._AC_... or ._SX...
    // Amazon modifiers are usually between the first dot and the extension dot
    // but the URL might already have them in the path.
    const cleanBase = basePart.replace(/\._[a-zA-Z0-9_]+_$/, "");

    // Construct new path with:
    // SX = Scale X (Width)
    // QL = Quality Level
    // FMwebp = Force WebP format (Amazon-specific modifier)
    const newPathname = `${cleanBase}._SX${width}_QL${quality}_FMwebp_${extension}`;

    url.pathname = newPathname;
    return url.toString();
  } catch (e) {
    return src;
  }
}
