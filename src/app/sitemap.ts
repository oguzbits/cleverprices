import { MetadataRoute } from "next";

import { DatabaseBusyError } from "@/db/utils";
import { getAllBlogPosts } from "@/lib/blog";
import {
  allCategories,
  type CategorySlug,
  getCategoryPath,
  isCategoryNotEmptyRecursive,
} from "@/lib/categories";
import { getAlternateLanguages } from "@/lib/metadata";
import {
  getAllProductSlugs,
  getCachedNonEmptyCategorySlugs as getNonEmptyCategorySlugs,
} from "@/lib/server/cached-products";
import { getSafeDate, getSafeNow } from "@/lib/server/deterministic-time";
import { CACHE_VERSION, SITE_URL } from "@/lib/site-config";
import { getProductPath } from "@/lib/utils/url";

/**
 * ARCHITECTURE NOTE:
 * We force-dynamic here to prevent Next.js from rendering the sitemap during the 'build' phase.
 * During build, the database is empty/in-memory, which would result in an empty sitemap being "baked" into the build.
 * By using 'force-dynamic', we ensure the sitemap is generated in the production environment where the real DB is.
 * Performant caching is still handled via the "use cache" directive below.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const _v = CACHE_VERSION;
  const baseUrl = SITE_URL;

  // Static routes (German-first priorities)
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1.0 },
    { path: "/blog", priority: 0.8 },
    { path: "/faq", priority: 0.7 },
    { path: "/datenschutz", priority: 0.5 },
    { path: "/agb", priority: 0.5 },
    { path: "/impressum", priority: 0.5 },
    { path: "/deals", priority: 0.9 },
    { path: "/categories", priority: 0.8 },
  ].map((route) => {
    return {
      url: `${baseUrl}${route.path}`,
      lastModified: getSafeDate(),
      changeFrequency: "monthly" as const,
      priority: route.priority,
      alternates: {
        languages: getAlternateLanguages(route.path),
      },
    };
  });

  try {
    const totalStart = getSafeNow();
    console.log("🗺️  Sitemap: Starting generation...");

    // Blog routes
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

    // Category routes
    const nonEmptyCategorySlugs = await getNonEmptyCategorySlugs();
    const activeSlugsSet = new Set(nonEmptyCategorySlugs); // O(1) lookups
    const allCategorySlugs = Object.keys(allCategories) as CategorySlug[];

    const categoryRoutes: MetadataRoute.Sitemap = allCategorySlugs
      .map((slug) => {
        const category = allCategories[slug];
        if (!category || category.hidden) return null;

        // Efficiently check if category or children have products
        if (!isCategoryNotEmptyRecursive(category.slug, activeSlugsSet)) {
          return null;
        }

        const categoryPath = getCategoryPath(category.slug);
        const alternates = getAlternateLanguages(categoryPath);

        return {
          url: `${baseUrl}${categoryPath}`,
          lastModified: getSafeDate(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
          alternates: {
            languages: alternates,
          },
        };
      })
      .filter((route) => route !== null) as MetadataRoute.Sitemap;

    // Product routes (Hub-Only Indexing)
    const allHubs = await getAllProductSlugs(undefined, false, true);

    const productRoutes: MetadataRoute.Sitemap = allHubs.map((product) => {
      const path = getProductPath(product.id, product.slug);
      return {
        url: `${baseUrl}${path}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: "daily" as const,
        priority: 0.6,
        alternates: {
          languages: {
            "x-default": `${baseUrl}${path}`,
            de: `${baseUrl}${path}`,
          },
        },
      };
    });

    const totalDuration = getSafeNow() - totalStart;
    const totalItems =
      staticRoutes.length +
      blogRoutes.length +
      productRoutes.length +
      categoryRoutes.length;
    console.log(
      `🗺️  Sitemap: Complete! (Total: ${totalDuration}ms, Items: ${totalItems})`,
    );

    return [
      ...staticRoutes,
      ...blogRoutes,
      ...categoryRoutes,
      ...productRoutes,
    ];
  } catch (error: unknown) {
    if (
      error instanceof DatabaseBusyError ||
      (error as { name?: string })?.name === "DatabaseBusyError"
    ) {
      console.warn("🗺️  Sitemap: Database busy, serving static routes only.");
      return staticRoutes;
    }
    throw error;
  }
}
