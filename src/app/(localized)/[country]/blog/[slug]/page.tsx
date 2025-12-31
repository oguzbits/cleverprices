import { BlogPostViewMDX } from "@/components/blog/blog-post-view-mdx";
import { getBlogPostBySlug } from "@/lib/blog";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { generateBlogPostParams } from "@/lib/static-params";
import { Metadata } from "next";
import { redirect } from "next/navigation";

interface LocalizedBlogPostPageProps {
  params: Promise<{ country: string; slug: string }>;
}

export async function generateStaticParams() {
  return await generateBlogPostParams();
}

export async function generateMetadata({
  params,
}: LocalizedBlogPostPageProps): Promise<Metadata> {
  const { slug, country } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const isUS = country.toLowerCase() === "us";
  const url = isUS
    ? `https://realpricedata.com/blog/${post.slug}`
    : `https://realpricedata.com/${country}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
      languages: getAlternateLanguages(`blog/${post.slug}`),
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

  if (country.toLowerCase() === "us") {
    redirect(`/blog/${slug}`);
  }

  return <BlogPostViewMDX slug={slug} country={country} />;
}
