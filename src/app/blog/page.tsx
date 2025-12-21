import { Metadata } from 'next';
import { getAllBlogPosts } from '@/lib/blog';
import { BlogCard } from '@/components/blog/blog-card';
import { SectionHeader } from '@/components/SectionHeader';

export const metadata: Metadata = {
  title: 'Blog | Market Trends & Hardware Pricing Insights',
  description: 'In-depth analysis of RAM, SSD, and HDD pricing trends. Learn how to save money on your next hardware purchase.',
  alternates: {
    canonical: 'https://realpricedata.com/blog',
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className="flex flex-col gap-0 pb-16 bg-background min-h-screen">
      <div className="container px-4 mx-auto pt-12 md:pt-20">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
            Hardware Market <br />
            <span className="text-[#3B82F6]">Insights & Trends</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Evergreen analytical articles about hardware pricing, market shifts, and how to find the best value for your setup.
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border rounded-3xl bg-muted/5">
            <h2 className="text-2xl font-bold mb-2">No articles yet</h2>
            <p className="text-muted-foreground">Check back soon for our first hardware market analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
