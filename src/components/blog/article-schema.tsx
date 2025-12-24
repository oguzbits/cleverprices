import { BlogPost } from "@/types/blog";

interface ArticleSchemaProps {
  post: BlogPost;
}

export function ArticleSchema({ post }: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Organization",
      name: "RealPriceData",
      url: "https://realpricedata.com",
    },
    publisher: {
      "@type": "Organization",
      name: "RealPriceData",
      logo: {
        "@type": "ImageObject",
        url: "https://realpricedata.com/icon-512.png",
      },
    },
    datePublished: post.publishDate,
    dateModified: post.lastUpdated || post.publishDate,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://realpricedata.com/blog/${post.slug}`,
    },
    // Optional: add citations/references to schema if desired
    citations: post.references || [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
