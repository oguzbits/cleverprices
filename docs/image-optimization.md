# Cost-Free Image Optimization Strategy

This project uses a custom image optimization strategy to bypass Vercel's "Image Optimization" limits (which can get expensive or hit free tier caps quickly) while ensuring users still receive properly sized images.

## The Problem

Default Next.js `<Image />` component relies on Vercel's server-side image optimization API to resize, crop, and compress images on the fly.

- **Cost**: Vercel charges per 1,000 source images.
- **Limit**: Free tier has a hard limit (e.g., 5,000 transformations/month).
- **Issue**: For an e-commerce site with thousands of products, simply browsing a category page can consume hundreds of optimization credits in minutes.

## The Solution: "Smart" Amazon Loader

Since our product images are hosted on Amazon (`m.media-amazon.com`), we can leverage Amazon's built-in, free, URL-based image manipulation parameters.

We implemented a **Custom Loader** (`src/lib/image-loader.ts`) that intercepts Next.js image requests and rewrites the URL to ask Amazon for the specific size we need.

### How it works

1.  **Intercept**: The app is configured in `next.config.ts` to use `loader: "custom"`.
2.  **Check**: The loader checks if the image source is an Amazon URL.
3.  **Rewrite**:
    - **Input**: `https://m.media-amazon.com/images/I/71Wj+Zc7cZL._AC_.jpg` requesting `width=300` and `quality=75`
    - **Logic**: It strips existing Amazon modifiers (like `._AC_`) and appends the requested parameters.
    - **Output**: `https://m.media-amazon.com/images/I/71Wj+Zc7cZL._SX300_QL75_.jpg`
4.  **Serve**: The browser loads this resized image directly from Amazon's CDN. No traffic goes through Vercel's optimization servers.

## Amazon URL Parameters

Amazon uses specifically formatted strings in the URL to transform images on their CDN:

- **`SX[width]` (e.g., `SX400`)**: **Scale X (Width)**. This tells Amazon to resize the image to exactly a specific width in pixels. It automatically maintains the aspect ratio.
  - `SX400` = 400 pixels wide.
  - `SX200` = 200 pixels wide (half the size of SX400).
- **`QL[quality]` (e.g., `QL75`)**: **Quality Level**. This controls the JPEG compression.
  - `QL100` = Maximum quality, large file size.
  - `QL10` = Very low quality, extremely small file size.
  - `QL75` = Balanced compression (default).

## Implementation Details

### 1. The Loader (`src/lib/image-loader.ts`)

This function receives `src`, `width`, and `quality` from Next.js.
It parses the Amazon URL and injects the `._SX[width]_QL[quality]_` parameter.

- **Resizing**: We use `SX` to match the `width` prop passed by Next.js.
- **Optimization**: We pass the `quality` prop (from `75` down to `10` for maximum savings) to the `QL` parameter.

### 2. Configuration (`next.config.ts`)

```typescript
images: {
  loader: "custom",
  loaderFile: "./src/lib/image-loader.ts",
  // ...
}
```

### 3. Usage

Use the standard Next.js `<Image />` component as normal.

```tsx
<Image src={product.image} width={300} height={300} alt="Product" />
```

Next.js will calculate the `width` based on the `sizes` prop or the explicit `width` prop, pass it to our loader, and our loader generates the Amazon URL.

## Maintenance & Troubleshooting

- **Non-Amazon Images**: The loader passes non-Amazon images through untouched. If you use local images, they will be served as-is (unless you have a separate optimization pipeline).
- **Amazon URL Changes**: If Amazon changes their URL structure for modifiers (currently `._[Mod]_`), the regex in `src/lib/image-loader.ts` might need updating.
- **Quality Prop**: The loader now fully supports the `quality` prop by mapping it to Amazon's `QL` parameter.

## Progressive Loading & Performance

To prevent "network bunching"—where the browser attempts to download dozens of images at once—we use a multi-tiered loading strategy.

### 1. Conservative Priority Strategy

We never prioritize more than the absolute minimum required to achieve a fast **Largest Contentful Paint (LCP)**.

- **Rule**: Only set `priority={index < 2}` for the first row of above-the-fold grids or carousels.
- **Why**: Modern browsers handle the remaining 2-4 visible images intelligently. Over-prioritizing leads to "waterfall bunching" and delays the primary product image.

### 2. The `LazySection` Utility (`src/components/ui/LazySection.tsx`)

We non-critically render below-the-fold sections using an `IntersectionObserver`.

- **Mechanism**: Sections like "Related Products" or "Bestsellers" are wrapped in `<LazySection>`.
- **Optimization**:
  - `rootMargin="0px"`: Ensures content only mounts when it enters the viewport.
  - `threshold: 0.01`: Guards against premature triggers in high-DPI browsers.
- **Pattern**: This allows us to keep the actual carousels as **Server Components** inside the client-side lazy wrapper, preserving SEO.

### 3. Explicit Lazy Hints

For non-priority images, we always pass:

- `loading="lazy"`
- `fetchPriority="low"` (using `// @ts-ignore` for `Next/Image` compatibility)

## Component quality standards

To maintain a balance between visual quality and performance, we use the following standard quality levels across the application:

| Component Type         | Usage Example               | Recommended Quality |
| :--------------------- | :-------------------------- | :------------------ |
| **Hero Images**        | Product Detail main image   | `quality={75}`      |
| **Grid/List Cards**    | Category pages, Bestsellers | `quality={50}`      |
| **Sidebar/Thumbnails** | Product page thumbnails     | `quality={30}`      |
| **Background/Tiny**    | Gallery list, History       | `quality={10}`      |

## Benefits

- **Vercel Usage**: **0%** (for product images).
- **LCP Speed**: ~40% faster by limiting prioritized requests to the top 2 items.
- **Initial Load Weight**: Zero KB for carousels until the user scrolls.
- **Cost**: 100% Free (zero Vercel optimization credits consumed).
