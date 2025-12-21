import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { cn } from '@/lib/utils';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  className?: string;
}

export function BlogCard({ post, className }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex flex-col p-6 rounded-2xl border border-border/60 bg-card hover:shadow-lg transition-all duration-300 no-underline",
        className
      )}
    >
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(post.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{post.readingTime}</span>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
        {post.title}
      </h3>

      <p className="text-muted-foreground text-sm line-clamp-3 mb-6 leading-relaxed">
        {post.description}
      </p>

      <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-primary">
        Read Article
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
