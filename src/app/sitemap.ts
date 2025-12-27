import { MetadataRoute } from "next";
import {
  getCategoryHierarchy,
  getCategoryPath,
  allCategories,
} from "@/lib/categories";
import { getAllCountries, DEFAULT_COUNTRY } from "@/lib/countries";
import { getAllBlogPosts } from "@/lib/blog";
import { getAlternateLanguages } from "@/lib/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://realpricedata.com";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/impressum",
    "/datenschutz",
    "/faq",
    "/blog",
    "/en/legal-notice",
    "/en/privacy",
  ].map((route) => {
    const entry: any = {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1.0 : 0.8,
    };

    // Add alternates for the homepage
    if (route === "") {
      entry.alternates = {
        languages: getAlternateLanguages(""),
      };
    }

    return entry;
  });

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
  const liveCountries = getAllCountries().filter((c) => c.isLive);
  const countries = liveCountries.map((c) => c.code);

  const countryRoutes: MetadataRoute.Sitemap = [];

  countries.forEach((country) => {
    // Country home page - skip for default country (US) as the root domain (/)
    // handles it and /us is non-canonical.
    if (country !== DEFAULT_COUNTRY) {
      countryRoutes.push({
        url: `${baseUrl}/${country}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
        alternates: {
          languages: getAlternateLanguages(""),
        },
      });
    }

    // Country categories page
    countryRoutes.push({
      url: `${baseUrl}/${country}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: {
        languages: getAlternateLanguages("/categories"),
      },
    });

    // Parent category pages
    categoryHierarchy.forEach((hierarchy) => {
      const path = `/${hierarchy.parent.slug}`;
      countryRoutes.push({
        url: `${baseUrl}/${country}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: {
          languages: getAlternateLanguages(path),
        },
      });
    });

    // Child category pages (product listing pages)
    Object.values(allCategories)
      .filter((cat) => cat.parent) // Only categories with parents
      .forEach((category) => {
        const fullPath = getCategoryPath(category.slug, country);
        countryRoutes.push({
          url: `${baseUrl}${fullPath}`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9, // Higher priority for product pages
          alternates: {
            languages: getAlternateLanguages(`/${category.parent}/${category.slug}`),
          },
        });
      });
  });

  return [...staticRoutes, ...blogRoutes, ...countryRoutes];
}
