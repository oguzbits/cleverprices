# Resource-Aware Vercel Patterns

This rule extends the Vercel React Best Practices skill with **resource-conscious patterns** specific to the CleverPrices project.

## Vercel Hobby Plan Limits

| Resource             | Limit        | Safeguard                                       |
| -------------------- | ------------ | ----------------------------------------------- |
| Serverless Execution | 60 seconds   | Use streaming, avoid N+1 queries                |
| Edge Function Size   | 1 MB         | Avoid heavy dependencies in middleware          |
| Build Time           | 45 minutes   | Use incremental builds, avoid full regeneration |
| Bandwidth            | 100 GB/month | Optimize images, use CDN caching                |

---

## Required Patterns

### 1. ISR over Full SSG for Large Catalogs

Never pre-render all product pages at build time. Use Incremental Static Regeneration (ISR) with `revalidate`:

```typescript
// ✅ Good: ISR with revalidation
export const revalidate = 3600; // 1 hour

// ❌ Bad: Full SSG for 7000+ products
export async function generateStaticParams() {
  const products = await db.select().from(products); // 7000+ pages at build!
  return products.map((p) => ({ slug: p.slug }));
}
```

### 2. Streaming for Slow Data

Use React Suspense to stream content and avoid Vercel timeout:

```tsx
// ✅ Good: Stream slow content
export default async function ProductPage() {
  return (
    <div>
      <ProductHeader /> {/* Fast */}
      <Suspense fallback={<Skeleton />}>
        <PriceChart /> {/* Slow - streamed */}
      </Suspense>
    </div>
  );
}
```

### 3. Avoid Heavy Middleware

Edge Functions have a 1 MB limit. Never import heavy libraries in `middleware.ts`:

```typescript
// ❌ Bad: Imports entire library
import { validate } from "some-heavy-validation-lib";

// ✅ Good: Use lightweight checks
export function middleware(req: NextRequest) {
  const token = req.cookies.get("session");
  if (!token) return NextResponse.redirect("/login");
}
```

### 4. Image Optimization

Always use `next/image` with explicit `sizes` to avoid bandwidth waste:

```tsx
// ✅ Good: Explicit sizes
<Image src={url} width={300} height={200} sizes="(max-width: 768px) 100vw, 300px" />

// ❌ Bad: Missing sizes (loads full resolution on mobile)
<Image src={url} width={300} height={200} />
```

---

## Cross-Reference

See [AGENTS.md](file:///Users/oguz/Desktop/Dev/cleverprices/AGENTS.md) for global resource rules.
