import Link from "next/link";
import { BlogPost } from "@/types/blog";
import { cn } from "@/lib/utils";
import { Calendar, Clock, ArrowRight } from "lucide-react";

interface BlogCardProps {
  post: BlogPost;
  className?: string;
}

export function BlogCard({ post, className }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group border-border/60 bg-card flex flex-col rounded-2xl border p-6 no-underline transition-all duration-300 hover:shadow-lg",
        className,
      )}
    >
      <div className="text-muted-foreground mb-4 flex items-center gap-4 text-sm font-medium">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {new Date(post.publishDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{post.readingTime}</span>
        </div>
      </div>

      <h3 className="group-hover:text-primary mb-3 line-clamp-2 text-xl leading-tight font-bold transition-colors">
        {post.title}
      </h3>

      <p className="text-muted-foreground mb-6 line-clamp-3 text-base leading-relaxed">
        {post.description}
      </p>

      <div className="text-primary mt-auto flex items-center gap-2 text-base font-semibold">
        Read Article
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
