import { BlogCard } from "@/components/blog/blog-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getAllBlogPosts } from "@/lib/blog";

interface BlogIndexViewProps {
  country: string;
}

export async function BlogIndexView({ country }: BlogIndexViewProps) {
  const posts = await getAllBlogPosts();

  const breadcrumbItems = [
    { name: "Home", href: country === "us" ? "/" : `/${country}` },
    { name: "Blog" },
  ];

  return (
    <div className="bg-background flex min-h-screen flex-col gap-0 pb-16">
      <div className="container mx-auto px-4 pt-12 md:pt-16">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mb-12 max-w-3xl">
          <h1 className="mb-6 text-4xl font-black italic leading-tight uppercase tracking-tighter sm:text-5xl md:text-6xl">
            Market{" "}
            <span className="text-primary not-italic -tracking-widest">
              Data
            </span>{" "}
            <br />
            Insights
          </h1>
          <p className="text-muted-foreground text-xl font-medium leading-relaxed">
            Real-time hardware market analysis and buying guides powered by live
            price data.
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} country={country} />
            ))}
          </div>
        ) : (
          <div className="border-border bg-muted/5 rounded-3xl border py-20 text-center">
            <h2 className="mb-2 text-2xl font-bold">No articles yet</h2>
            <p className="text-muted-foreground">
              Check back soon for our first hardware market analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
