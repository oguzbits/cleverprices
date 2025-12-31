import { BlogPostView } from "@/components/blog/blog-post-view";
import { getBlogPostBySlug } from "@/lib/blog";
import { getOpenGraph } from "@/lib/metadata";
import { Metadata } from "next";

interface LocalizedBlogPostPageProps {
  params: Promise<{ country: string; slug: string }>;
}

export async function generateStaticParams() {
  // We can pre-render some main countries if needed, or just let it be dynamic
  // For now, let's keep it simple.
  return []; 
}

export async function generateMetadata({
  params,
}: LocalizedBlogPostPageProps): Promise<Metadata> {
  const { slug, country } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const url = `https://realpricedata.com/${country}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: getOpenGraph({
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishDate,
      modifiedTime: post.lastUpdated,
      authors: [post.author.name],
      url,
    }),
  };
}

export default async function LocalizedBlogPostPage({
  params,
}: LocalizedBlogPostPageProps) {
  const { slug, country } = await params;
  return <BlogPostView slug={slug} country={country} />;
}
