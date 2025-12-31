import type { MDXComponents } from "mdx/types";

/**
 * Global MDX components configuration
 * This file is used by @next/mdx to provide components to all MDX files
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Default component overrides
    h2: (props) => (
      <h2
        className="mb-8 mt-16 text-3xl font-black uppercase italic tracking-tight"
        {...props}
      />
    ),
    h3: (props) => (
      <h3 className="mb-4 mt-12 text-xl font-bold uppercase" {...props} />
    ),
    p: (props) => (
      <p
        className="text-muted-foreground mb-6 text-lg font-medium leading-relaxed"
        {...props}
      />
    ),
    ...components,
  };
}
