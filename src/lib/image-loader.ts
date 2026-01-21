"use client";

import { getAmazonImageUrl, type ImageLoaderParams } from "./utils/images";

export default function amazonImageLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderParams): string {
  return getAmazonImageUrl({ src, width, quality, format: "webp" });
}
