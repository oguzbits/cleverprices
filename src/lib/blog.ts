"use cache";

import { BlogFrontmatter, BlogPost } from "@/types/blog";
import fs from "fs";
import matter from "gray-matter";
import path from "path";

const BLOG_DIRECTORY = path.join(process.cwd(), "src/content/blog");

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  if (!fs.existsSync(BLOG_DIRECTORY)) {
    return [];
  }

  const fileNames = fs.readdirSync(BLOG_DIRECTORY);

  const posts = fileNames
    .filter((fileName) => fileName.endsWith(".md") || fileName.endsWith(".mdx"))
    .map((fileName) => {
      const fullPath = path.join(BLOG_DIRECTORY, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);
      const frontmatter = data as BlogFrontmatter;

      return {
        ...frontmatter,
        content,
        author: {
          name: frontmatter.authorName,
          role: frontmatter.authorRole,
        },
      } as BlogPost;
    })
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
    );

  return posts;
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  // Optimized: Read only the requested file instead of all files
  const mdxPath = path.join(BLOG_DIRECTORY, `${slug}.mdx`);
  const mdPath = path.join(BLOG_DIRECTORY, `${slug}.md`);

  let filePath: string | null = null;
  if (fs.existsSync(mdxPath)) {
    filePath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    filePath = mdPath;
  }

  if (!filePath) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const frontmatter = data as BlogFrontmatter;

  return {
    ...frontmatter,
    content,
    author: {
      name: frontmatter.authorName,
      role: frontmatter.authorRole,
    },
  } as BlogPost;
}

export async function calculateReadingTime(content: string): Promise<string> {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return `${time} min read`;
}
