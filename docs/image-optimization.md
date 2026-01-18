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
- **Quality Prop**: Currently, the loader ignores the `quality` prop (Amazon doesn't expose a simple URL param for compression quality in the same way).

## Benefits

- **Vercel Usage**: **0%** (for product images).
- **Performance**: Fast (Amazon CloudFront CDN).
- **Cost**: Free.
