"use client";

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function amazonImageLoader({
  src,
  width,
}: ImageLoaderParams): string {
  // If it's not an Amazon image, return as is (Next.js will handle it or serve as-is if unoptimized isn't working for local?)
  // Note: With "loader: custom" in next.config.ts, this runs for ALL images.
  // For local images, we just return the path. Browsers will load the original file.
  if (
    !src.includes("m.media-amazon.com") &&
    !src.includes("images-na.ssl-images-amazon.com")
  ) {
    return src;
  }

  // Handle Amazon URLs
  // Pattern: https://m.media-amazon.com/images/I/71Wj+Zc7cZL._AC_SL1500_.jpg
  // We want to replace/inject the size param: ._SX{width}_

  try {
    const url = new URL(src);
    const pathname = url.pathname;

    // Split extension
    const lastDotIndex = pathname.lastIndexOf(".");
    if (lastDotIndex === -1) return src;

    const extension = pathname.substring(lastDotIndex);
    let basePart = pathname.substring(0, lastDotIndex);

    // Check if basePart already has a modifier (ends with _)
    // Regex for Amazon modifiers: \._[A-Z]{2}.*_$ (e.g. ._AC_SL1500_)
    // or simply look for the last dot in the basePart if it exists.
    // Amazon ID usually doesn't contain dots, but modifiers start with dot.
    // Base: /images/I/ID
    // Full: /images/I/ID.modifier

    // Let's look for the dot before the unique ID. The ID is the last path segment.
    // simpler approach:
    // Regex to match the ID and optional existing modifiers.
    // We want to strip existing modifier "._XY..." and append "._SX..."

    // Common pattern: [ID].[modifier]
    // We want: [ID]._SX{width}_

    // Find the ID. It's usually the part after /images/I/
    // But let's be more generic.

    // We can detect if there's a modifier by checking for `._` followed by characters and ending with `_` before the extension
    // But safer is just to strip anything after the first dot in the filename?
    // No, filenames might have dots? Amazon IDs usually don't.

    // Let's use a robust regex for Amazon URL replacement
    // Strips existing sizing params like ._AC_... or ._SX... or ._SY...
    const cleanBase = basePart.replace(/\._[a-zA-Z0-9_]+_$/, "");

    // Construct new path
    // We use SX (width) to limit width. Amazon preserves aspect ratio.
    const newPathname = `${cleanBase}._SX${width}_${extension}`;

    url.pathname = newPathname;
    return url.toString();
  } catch (e) {
    // If URL parsing fails, return original
    return src;
  }
}
