"use client";

import { getAmazonImageUrl, type ImageLoaderParams } from "./utils/images";

export default function amazonImageLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderParams): string {
  // Use AVIF globally for maximum compression
  return getAmazonImageUrl({ src, width, quality, format: "avif" });
}
