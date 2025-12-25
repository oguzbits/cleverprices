import { Metadata } from "next";
import { getAllBlogPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/blog-card";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Blog | Market Trends & Hardware Pricing Insights",
  description:
    "In-depth analysis of RAM, SSD, and HDD pricing trends. Learn how to save money on your next hardware purchase.",
  alternates: {
    canonical: "https://realpricedata.com/blog",
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className="bg-background flex min-h-screen flex-col gap-0 pb-16">
      <div className="container mx-auto px-4 pt-12 md:pt-20">
        <div className="mb-12 max-w-3xl">
          <h1 className="mb-6 text-4xl leading-tight font-black tracking-tighter sm:text-5xl md:text-6xl">
            Hardware Market <br />
            <span className="text-[#3B82F6]">Insights & Trends</span>
          </h1>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Evergreen analytical articles about hardware pricing, market shifts,
            and how to find the best value for your setup.
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="bg-muted/5 rounded-3xl border py-20 text-center">
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
