import { Metadata } from "next";

import { BlogPostViewMDX } from "@/components/blog/blog-post-view-mdx";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site-config";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
      robots: { index: false, follow: false },
    };
  }

  const path = `/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: getAlternateLanguages(path),
    },
    openGraph: getOpenGraph({
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishDate,
      modifiedTime: post.lastUpdated,
      authors: [post.author.name],
      url: `${SITE_URL}${path}`,
    }),
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  return <BlogPostViewMDX slug={slug} country="de" />;
}
