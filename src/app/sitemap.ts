import { getAllBlogPosts } from "@/lib/blog";
import { getCategoryHierarchy } from "@/lib/categories";
import { getAlternateLanguages } from "@/lib/metadata";
import {
  getAllProductSlugs,
  getNonEmptyCategorySlugs,
} from "@/lib/server/cached-products";
import { SITE_URL } from "@/lib/site-config";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1.0 },
    { path: "/blog", priority: 0.8 },
    { path: "/faq", priority: 0.7 },
    {
      path: "/privacy",
      priority: 0.5,
      customTrans: { de: "/datenschutz" },
      hidden: true,
    },
    {
      path: "/datenschutz",
      priority: 0.5,
      customTrans: { de: "/datenschutz" },
    },
    {
      path: "/legal-notice",
      priority: 0.5,
      customTrans: { de: "/impressum" },
      hidden: true,
    },
    { path: "/impressum", priority: 0.5, customTrans: { de: "/impressum" } },
    { path: "/deals", priority: 0.9 },
  ]
    .filter((route) => !(route as any).hidden)
    .map(({ path, priority, customTrans }) => {
      // Determine the base path for alternates
      // For legal pages, 'privacy' and 'legal-notice' are the base paths for all en-REGION variants
      let alternatesPath = path;
      if (path === "/datenschutz") alternatesPath = "/privacy";
      if (path === "/impressum") alternatesPath = "/legal-notice";

      return {
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority,
        alternates: {
          languages: getAlternateLanguages(alternatesPath, customTrans),
        },
      };
    });

  // Blog posts
  const blogPosts = await getAllBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => {
    const postPath = `/blog/${post.slug}`;
    return {
      url: `${baseUrl}${postPath}`,
      lastModified: new Date(post.lastUpdated || post.publishDate),
      changeFrequency: "daily" as const,
      priority: 0.7,
      alternates: {
        languages: getAlternateLanguages(postPath),
      },
    };
  });

  // Product pages - high priority for SEO
  const allProducts = await getAllProductSlugs();
  // SEO SAFETY: Only include products that have reached "optimized" status (enriched with Icecat/eBay)
  // This ensures Google only committed to stable, high-quality URLs.
  const products = allProducts.filter(
    (p) =>
      p.enrichmentStatus === "optimized" || p.enrichmentStatus === "processed",
  );

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => {
    const productPath = `/p/${product.slug.includes("_-") ? product.slug : `${200000000 + product.id}_-${product.slug}`}`;
    return {
      url: `${baseUrl}${productPath}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9, // High priority - these are our main content
      alternates: {
        languages: getAlternateLanguages(productPath),
      },
    };
  });

  // Category routes
  const categoryHierarchy = getCategoryHierarchy();
  const nonEmptyCategorySlugs = await getNonEmptyCategorySlugs();
  const categoryRoutes: MetadataRoute.Sitemap = [];

  // 1. Categories listing page
  categoryRoutes.push({
    url: `${baseUrl}/categories`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
    alternates: {
      languages: getAlternateLanguages("/categories"),
    },
  });

  // 2. Parent categories
  categoryHierarchy.forEach((hierarchy) => {
    // A parent category is included if at least one of its children is non-empty
    const activeChildren = hierarchy.children.filter(
      (child) => !child.hidden && nonEmptyCategorySlugs.includes(child.slug),
    );

    if (activeChildren.length === 0) return;

    const path = `/${hierarchy.parent.slug}`;
    categoryRoutes.push({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: getAlternateLanguages(path),
      },
    });

    // 3. Child categories
    activeChildren.forEach((child) => {
      const fullPath = `/${child.slug}`;
      categoryRoutes.push({
        url: `${baseUrl}${fullPath}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
        alternates: {
          languages: getAlternateLanguages(fullPath),
        },
      });
    });
  });

  return [...staticRoutes, ...blogRoutes, ...productRoutes, ...categoryRoutes];
}
