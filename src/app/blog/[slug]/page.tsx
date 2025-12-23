import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/blog';
import { MarkdownRenderer } from '@/components/blog/markdown-renderer';
import { ArticleSchema } from '@/components/blog/article-schema';
import { Calendar, Clock, User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug }  = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://realpricedata.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishDate,
      modifiedTime: post.lastUpdated,
      authors: [post.author.name],
      url: `https://realpricedata.com/blog/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
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

  return (
    <article className="min-h-screen bg-background pb-20">
      <ArticleSchema post={post} />
      
      {/* Article Header */}
      <header className="bg-muted/30 border-b">
        <div className="container px-4 mx-auto py-12 md:py-20 max-w-4xl">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-base font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>
          
          <div className="flex flex-wrap items-center gap-4 mb-6 text-base font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{post.readingTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{post.author.name}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] mb-8">
            {post.title}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium">
            {post.description}
          </p>
        </div>
      </header>

      {/* Article Content */}
      <div className="container px-4 mx-auto py-12 md:py-16 max-w-4xl">
        <MarkdownRenderer content={post.content} />
        
        {/* Post Footer / References */}
        {post.references && post.references.length > 0 && (
          <div className="mt-16 pt-8 border-t">
            <h2 className="text-xl font-bold mb-4">References</h2>
            <ul className="space-y-2">
              {post.references.map((ref, index) => (
                <li key={index} className="text-base text-muted-foreground">
                  <span className="font-mono text-sm inline-block w-6">[{index + 1}]</span>
                  <a href={ref} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FAQ Section */}
        {post.faqs && post.faqs.length > 0 && (
          <div className="mt-16 pt-8 border-t">
            <h2 className="text-3xl font-black mb-8 tracking-tight">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {post.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-bold text-lg">
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
