import { ArticleSchema } from "@/components/blog/article-schema";
import { LocalizedLink, QuickPicks } from "@/components/blog/mdx-components";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getBlogPostBySlug } from "@/lib/blog";
import { getAllProducts } from "@/lib/product-registry";
import { Calendar, Clock, User } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";

interface BlogPostViewProps {
  slug: string;
  country: string;
}

export async function BlogPostView({ slug, country }: BlogPostViewProps) {
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const breadcrumbItems = [
    { name: "Home", href: country === "us" ? "/" : `/${country}` },
    { name: "Blog", href: country === "us" ? "/blog" : `/${country}/blog` },
    { name: post.title },
  ];

  const components = {
    QuickPicks: ({ category, limit }: { category: string; limit?: number }) => {
      // Fetch products on the server
      const products = getAllProducts().filter((p) => p.category === category);
      return (
        <QuickPicks
          category={category}
          products={products}
          limit={limit}
          country={country}
        />
      );
    },
    Link: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <LocalizedLink
        {...props}
        href={props.href!}
        country={country}
      >
        {props.children}
      </LocalizedLink>
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2
        className="mb-8 mt-16 text-3xl font-black uppercase italic tracking-tight"
        {...props}
      />
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="mb-4 mt-12 text-xl font-bold uppercase" {...props} />
    ),
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p
        className="text-muted-foreground mb-6 text-lg font-medium leading-relaxed"
        {...props}
      />
    ),
  };

  return (
    <article className="bg-background min-h-screen pb-20">
      <ArticleSchema post={post} />

      <header className="relative overflow-hidden border-b bg-muted/30">
        <div className="bg-size-[40px_40px] absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)]" />

        <div className="container relative mx-auto max-w-4xl px-4 py-12 md:py-20">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="text-muted-foreground mt-8 mb-6 flex flex-wrap items-center gap-6 text-sm font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Calendar className="text-primary h-4 w-4" />
              <span>
                {new Date(post.publishDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="text-primary h-4 w-4" />
              <span>{post.author.name}</span>
            </div>
          </div>

          <h1 className="mb-8 text-5xl font-black leading-none uppercase tracking-tighter sm:text-6xl md:text-7xl">
            {post.title}
          </h1>

          <p className="text-muted-foreground border-primary text-xl font-medium leading-relaxed italic border-l-4 pl-6 md:text-2xl">
            {post.description}
          </p>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="prose prose-neutral dark:prose-invert max-w-none prose-a:text-primary prose-a:no-underline">
          <MDXRemote source={post.content} components={components} />
        </div>

        {post.references && post.references.length > 0 && (
          <div className="mt-20 border-t pt-10">
            <h2 className="mb-6 text-2xl font-black uppercase tracking-tight">
              Market References
            </h2>
            <ul className="grid gap-4">
              {post.references.map((ref, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary font-mono text-sm leading-6">
                    [{index + 1}]
                  </span>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground break-all transition-colors hover:text-primary hover:underline"
                  >
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {post.faqs && post.faqs.length > 0 && (
          <div className="mt-20 border-t pt-10">
            <h2 className="mb-10 text-3xl font-black uppercase italic tracking-tight">
              Common <span className="text-primary not-italic">Market</span>{" "}
              Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {post.faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-border/50"
                >
                  <AccordionTrigger className="text-left text-lg font-bold uppercase transition-colors hover:text-primary hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-lg font-medium leading-relaxed">
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
