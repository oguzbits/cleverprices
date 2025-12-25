import { MetadataRoute } from "next";
import {
  getCategoryHierarchy,
  getCategoryPath,
  allCategories,
} from "@/lib/categories";
import { getAllCountries } from "@/lib/countries";
import { getAllBlogPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://realpricedata.com";

  // Static routes
  const staticRoutes = [
    "",
    "/impressum",
    "/datenschutz",
    "/faq",
    "/blog",
    "/en/legal-notice",
    "/en/privacy",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Blog posts
  const blogPosts = await getAllBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.lastUpdated || post.publishDate),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Get category hierarchy
  const categoryHierarchy = getCategoryHierarchy();

  // Generate URLs for all live countries
  const countries = getAllCountries()
    .filter((c) => c.isLive)
    .map((c) => c.code);

  const countryRoutes: MetadataRoute.Sitemap = [];

  countries.forEach((country) => {
    // Country home page
    countryRoutes.push({
      url: `${baseUrl}/${country}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    });

    // Country categories page
    countryRoutes.push({
      url: `${baseUrl}/${country}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    });

    // Parent category pages
    categoryHierarchy.forEach((hierarchy) => {
      countryRoutes.push({
        url: `${baseUrl}/${country}/${hierarchy.parent.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      });
    });

    // Child category pages (product listing pages)
    Object.values(allCategories)
      .filter((cat) => cat.parent) // Only categories with parents
      .forEach((category) => {
        countryRoutes.push({
          url: `${baseUrl}${getCategoryPath(category.slug, country)}`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9, // Higher priority for product pages
        });
      });
  });

  return [...staticRoutes, ...blogRoutes, ...countryRoutes];
}
