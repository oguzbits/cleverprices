import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://realpricedata.com'
  
  // Static routes
  const routes = [
    '',
    '/categories',
    '/impressum',
    '/datenschutz',
    '/en/impressum',
    '/en/datenschutz',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic categories (Mocked for now)
  const categories = [
    'storage',
    'protein-powder',
    'laundry-detergent',
    'diapers',
    'batteries',
  ].map((slug) => ({
    url: `${baseUrl}/categories/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...routes, ...categories]
}
