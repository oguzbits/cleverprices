import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        // Custom overrides to match brand
        "prose-h1:text-4xl prose-h1:sm:text-5xl prose-h1:md:text-6xl prose-h1:font-black prose-h1:tracking-tighter",
        "prose-h2:text-3xl prose-h2:font-black prose-h2:tracking-tight prose-h2:mt-12 prose-h2:mb-6",
        "prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg",
        "prose-a:text-primary prose-a:no-underline",
        "prose-blockquote:border-primary/20 prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-xl",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const isInternal =
              href?.startsWith("/") ||
              href?.startsWith("https://realpricedata.com");
            return (
              <Link
                href={href || "#"}
                target={isInternal ? undefined : "_blank"}
                rel={isInternal ? undefined : "noopener noreferrer"}
                className="transition-all hover:underline"
              >
                {children}
              </Link>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
