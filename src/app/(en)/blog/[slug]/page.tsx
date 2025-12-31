import { BlogPostViewMDX } from "@/components/blog/blog-post-view-mdx";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";
import { getOpenGraph } from "@/lib/metadata";
import { Metadata } from "next";

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
    };
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://realpricedata.com/blog/${post.slug}`,
    },
    openGraph: getOpenGraph({
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishDate,
      modifiedTime: post.lastUpdated,
      authors: [post.author.name],
      url: `https://realpricedata.com/blog/${post.slug}`,
    }),
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  return <BlogPostViewMDX slug={slug} country="us" />;
}
