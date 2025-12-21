export interface BlogPost {
  title: string;
  description: string;
  slug: string;
  publishDate: string;
  lastUpdated: string;
  readingTime: string;
  author: {
    name: string;
    role?: string;
  };
  references?: string[];
  content: string;
  category?: string;
  tags?: string[];
  faqs?: { question: string; answer: string }[];
}

export interface BlogFrontmatter {
  title: string;
  description: string;
  slug: string;
  publishDate: string;
  lastUpdated: string;
  readingTime: string;
  authorName: string;
  authorRole?: string;
  references?: string[];
  category?: string;
  tags?: string[];
  faqs?: { question: string; answer: string }[];
}
