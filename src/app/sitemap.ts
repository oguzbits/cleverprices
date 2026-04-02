import { getAllBlogPosts } from "@/lib/blog";
import {
  allCategories,
  getCategoryPath,
  isCategoryNotEmptyRecursive,
  type CategorySlug,
} from "@/lib/categories";
import { getAlternateLanguages } from "@/lib/metadata";
import {
  getAllProductSlugs,
  getNonEmptyCategorySlugs,
} from "@/lib/server/cached-products";
import { SITE_URL } from "@/lib/site-config";
import { getProductPath } from "@/lib/utils/url";
import { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";

/**
 * ARCHITECTURE NOTE:
 * We force-dynamic here to prevent Next.js from rendering the sitemap during the 'build' phase.
 * During build, the database is empty/in-memory, which would result in an empty sitemap being "baked" into the build.
 * By using 'force-dynamic', we ensure the sitemap is generated in the production environment where the real DB is.
 * Performant caching is still handled via the "use cache" directive below.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("product");
  const _v = "v217-hubs-parity-fix";
  cacheTag("sitemap", "sitemap-slugs", _v);

  const totalStart = Date.now();
  console.log("🗺️  Sitemap: Starting generation...");
  const baseUrl = SITE_URL;

  // Static routes (German-first priorities)
  console.time("⏱️  Sitemap: Static Routes");
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1.0 },
    { path: "/blog", priority: 0.8 },
    { path: "/faq", priority: 0.7 },
    { path: "/datenschutz", priority: 0.5 },
    { path: "/agb", priority: 0.5 },
    { path: "/impressum", priority: 0.5 },
    { path: "/deals", priority: 0.9 },
  ].map((route) => {
    return {
      url: `${baseUrl}${route.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route.priority,
      alternates: {
        languages: getAlternateLanguages(route.path),
      },
    };
  });
  console.timeEnd("⏱️  Sitemap: Static Routes");

  // Blog routes
  console.time("⏱️  Sitemap: Blog Posts");
  const blogPosts = await getAllBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => {
    const path = `/blog/${post.slug}`;
    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(post.lastUpdated || post.publishDate),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: getAlternateLanguages(path),
      },
    };
  });
  console.timeEnd("⏱️  Sitemap: Blog Posts");

  // Product routes (Hub-Only Indexing)
  console.time("⏱️  Sitemap: Product Hubs");
  // includeVariants: false ensures we only get the 'Series' hubs (Synthetic IDs 900M+)
  const allHubs = await getAllProductSlugs(undefined, false, true);
  const productRoutes: MetadataRoute.Sitemap = allHubs.map((product) => {
    const path = getProductPath(product.id, product.slug);
    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.6,
      alternates: {
        languages: getAlternateLanguages(path),
      },
    };
  });
  console.timeEnd("⏱️  Sitemap: Product Hubs");

  // Category routes
  console.time("⏱️  Sitemap: Categories");
  const nonEmptyCategorySlugs = await getNonEmptyCategorySlugs();
  const allCategorySlugs = Object.keys(allCategories) as CategorySlug[];

  const categoryRoutes: MetadataRoute.Sitemap = allCategorySlugs
    .map((slug) => {
      const category = allCategories[slug];
      if (!category || category.hidden) return null;

      // Recursive check: Include category if it OR any of its children have products
      if (!isCategoryNotEmptyRecursive(category.slug, nonEmptyCategorySlugs)) {
        return null;
      }

      const categoryPath = getCategoryPath(category.slug);
      return {
        url: `${baseUrl}${categoryPath}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: {
          languages: getAlternateLanguages(categoryPath),
        },
      };
    })
    .filter((route): route is any => !!route);
  console.timeEnd("⏱️  Sitemap: Categories");

  const totalDuration = Date.now() - totalStart;
  const totalItems =
    staticRoutes.length +
    blogRoutes.length +
    productRoutes.length +
    categoryRoutes.length;
  console.log(
    `🗺️  Sitemap: Complete! (Total: ${totalDuration}ms, Items: ${totalItems})`,
  );

  return [...staticRoutes, ...blogRoutes, ...categoryRoutes, ...productRoutes];
}
