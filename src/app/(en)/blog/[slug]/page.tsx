import { ArticleSchema } from "@/components/blog/article-schema";
import { MarkdownRenderer } from "@/components/blog/markdown-renderer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";
import { Calendar, Clock, User } from "lucide-react";
import { getOpenGraph } from "@/lib/metadata";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";

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
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: post.title },
  ];

  return (
    <article className="bg-background min-h-screen pb-20">
      <ArticleSchema post={post} />

      {/* Article Header */}
      <header className="bg-muted/30 border-b">
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="text-muted-foreground mb-6 flex flex-wrap items-center gap-4 text-base font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(post.publishDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{post.author.name}</span>
            </div>
          </div>

          <h1 className="mb-8 text-4xl leading-[1.1] font-black tracking-tighter md:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          <p className="text-muted-foreground text-xl leading-relaxed font-medium md:text-2xl">
            {post.description}
          </p>
        </div>
      </header>

      {/* Article Content */}
      <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        <MarkdownRenderer content={post.content} />

        {/* Post Footer / References */}
        {post.references && post.references.length > 0 && (
          <div className="mt-16 border-t pt-8">
            <h2 className="mb-4 text-xl font-bold">References</h2>
            <ul className="space-y-2">
              {post.references.map((ref, index) => (
                <li key={index} className="text-muted-foreground text-base">
                  <span className="inline-block w-6 font-mono text-sm">
                    [{index + 1}]
                  </span>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors hover:underline"
                  >
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FAQ Section */}
        {post.faqs && post.faqs.length > 0 && (
          <div className="mt-16 border-t pt-8">
            <h2 className="mb-8 text-3xl font-black tracking-tight">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {post.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-bold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </article>
  );
}
