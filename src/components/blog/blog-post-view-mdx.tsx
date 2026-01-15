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
import { getProductsByCategory } from "@/lib/product-registry";
import { Calendar, Clock, User } from "lucide-react";
import { notFound } from "next/navigation";

interface BlogPostViewMDXProps {
  slug: string;
  country: string;
}

/**
 * Blog post view using build-time compiled MDX
 * This replaces next-mdx-remote with @next/mdx for better performance
 */
export async function BlogPostViewMDX({ slug, country }: BlogPostViewMDXProps) {
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: post.title },
  ];

  // Dynamically import the compiled MDX file
  let MDXContent;
  try {
    const mdxModule = await import(`@/content/blog/${slug}.mdx`);
    MDXContent = mdxModule.default;
  } catch (error) {
    console.error(`Failed to load MDX for slug: ${slug}`, error);
    notFound();
  }

  // Prepare MDX components with server-side data
  const components = {
    QuickPicks: async ({
      category,
      limit,
    }: {
      category: string;
      limit?: number;
    }) => {
      const products = await getProductsByCategory(category);
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
      <LocalizedLink {...props} href={props.href!} country={country}>
        {props.children}
      </LocalizedLink>
    ),
  };

  return (
    <article className="bg-background min-h-screen pb-20">
      <ArticleSchema post={post} />

      <header className="bg-muted/30 relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[40px_40px] opacity-10" />

        <div className="relative container mx-auto max-w-4xl px-4 py-12 md:py-20">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="text-muted-foreground mt-8 mb-6 flex flex-wrap items-center gap-6 text-sm font-bold tracking-widest uppercase">
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

          <h1 className="mb-8 text-5xl leading-none font-black tracking-tighter uppercase sm:text-6xl md:text-7xl">
            {post.title}
          </h1>

          <p className="text-muted-foreground border-primary border-l-4 pl-6 text-xl leading-relaxed font-medium italic md:text-2xl">
            {post.description}
          </p>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="prose prose-neutral dark:prose-invert prose-a:text-primary prose-a:no-underline max-w-none">
          <MDXContent components={components} />
        </div>

        {post.references && post.references.length > 0 && (
          <div className="mt-20 border-t pt-10">
            <h2 className="mb-6 text-2xl font-black tracking-tight uppercase">
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
                    className="text-muted-foreground hover:text-primary break-all transition-colors hover:underline"
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
            <h2 className="mb-10 text-3xl font-black tracking-tight uppercase italic">
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
                  <AccordionTrigger className="hover:text-primary text-left text-lg font-bold uppercase transition-colors hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-lg leading-relaxed font-medium">
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
