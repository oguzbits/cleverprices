export interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
  format?: "webp" | "avif";
}

/**
 * Shared logic for generating Amazon Image URLs with modifiers.
 * This can be used in both Client Components and Server Components (for preloading).
 */
export function getAmazonImageUrl({
  src,
  width,
  quality = 75,
  format = "webp",
}: ImageLoaderParams): string {
  // If it's not an Amazon image, return as is
  if (
    !src.includes("m.media-amazon.com") &&
    !src.includes("images-na.ssl-images-amazon.com")
  ) {
    return src;
  }

  try {
    const url = new URL(src);
    const pathname = url.pathname;

    // Split extension
    const lastDotIndex = pathname.lastIndexOf(".");
    if (lastDotIndex === -1) return src;

    const extension = pathname.substring(lastDotIndex);
    const basePart = pathname.substring(0, lastDotIndex);

    // Strip existing modifiers like ._AC_... or ._SX...
    const cleanBase = basePart.replace(/\._[a-zA-Z0-9_]+_$/, "");

    // Construct new path with:
    // SX = Scale X (Width)
    // QL = Quality Level
    // FM = Format (webp or avif)
    const newPathname = `${cleanBase}._SX${width}_QL${quality}_FM${format}_${extension}`;

    url.pathname = newPathname;
    return url.toString();
  } catch (_e) {
    return src;
  }
}
