import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import {
  PRICE_CACHE_STALE_SECONDS,
  PRICE_REVALIDATE_SECONDS,
} from "./src/lib/site-config";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true, // Enable "use cache" directive for caching
  // Configure MDX file extensions
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },
  // Cache Life Profiles for Next.js 16 "use cache"
  cacheLife: {
    prices: {
      stale: PRICE_CACHE_STALE_SECONDS, // Amazon ToS compliance
      revalidate: PRICE_REVALIDATE_SECONDS,
      expire: 604800, // 7 days (unchanged)
    },
  },
  // Optimize images
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    qualities: [50, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
        pathname: "/images/**",
      },
    ],
  },
};

// Wrap config with MDX support
const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [
      "remark-gfm",
      ["remark-frontmatter", { type: "yaml", marker: "-" }],
      "remark-mdx-frontmatter",
    ],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
