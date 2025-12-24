import { MetadataRoute } from "next";
import {
  getCategoryHierarchy,
  getCategoryPath,
  allCategories,
} from "@/lib/categories";
import { getAllCountries } from "@/lib/countries";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://realpricedata.com";

  // Static routes
  const routes = ["", "/impressum", "/datenschutz", "/faq"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Get category hierarchy
  const categoryHierarchy = getCategoryHierarchy();

  // Generate URLs for all supported countries
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
      priority: 0.9,
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

  return [...routes, ...countryRoutes];
}
