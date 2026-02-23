# 🚫 Archive of Failed Attempts

This document tracks technical approaches that were tried in CleverPrices but ultimately failed or caused regressions. **Read this before attempting to "optimize" core systems.**

## 1. Navigation & Routing

### ❌ Attempt: Manual hover-based `router.prefetch()`

- **Where**: `src/components/ui/PrefetchLink.tsx`
- **Symptom**: Links often required a **double-click** or a **window resize** to actually trigger the navigation. The URL would change, but the UI would stay on the old page.
- **Root Cause**: In Next.js 15/16, manually calling `router.prefetch()` inside client events (mouseenter/focus) can create race conditions with the native `<Link prefetch={true}>` handler. This confuses the React Transition scheduler, causing it to "suspend" the commit indefinitely until a global event (like resize) flushes the queue.
- **Lesson**: Trust Next.js's native `prefetch={true}`. It is highly optimized and integrated with the browser's idle callback.

### ❌ Attempt: Disabling `staleTimes` (Defaulting to 0)

- **Where**: `next.config.ts`
- **Symptom**: Navigation felt "frozen" or "laggy". After clicking a link, nothing would happen for 1-2 seconds, followed by an instant jump.
- **Root Cause**: Next.js 15+ changed the default `staleTimes.dynamic` to 0. This means every single navigation (even clicking "Back") forces a fresh fetch from the server before the transition can even start.
- **Lesson**: Keep `staleTimes.dynamic` at ~30s to allow the client-side router to provide instant feedback.

### ❌ Attempt: Top-Level `loading.tsx` and Skeletons

- **Where**: `src/app/[categorySlug]/loading.tsx`
- **Symptom**: "Blinking" or "Flickering" UI. Layout shifts when skeletons are replaced by real content.
- **Root Cause**: User preference for "Idealo-like" behavior. Premium sites often "hold" the current page until the next one is ready, or render a partial "Shell" instantly. Full-page skeletons feel cheap and interrupt the flow.
- **Lesson**: Use `Suspense fallback={null}` at the leaf components, or use the **Hold-First (Async Page)** pattern for premium catalog navigation.

### ❌ Attempt: Synchronous "Shell-First" Rendering

- **Where**: `src/app/[categorySlug]/page.tsx` and `src/components/category/IdealoCategoryPage.tsx`
- **Symptom**: "Flickering" UI during navigation. The browser would instantly update the URL and show the Header/Breadcrumbs/Filter Shell, but the product list would be blank for 100-300ms before appearing.
- **Root Cause**: Next.js commits navigation as soon as the synchronous shell is ready. While this makes the URL change fast, it results in a "cheap" feeling where the page contents "pop in" after the layout.
- **Lesson**: For a premium search engine experience, it is better to **Hold** the current page until the new content is fully ready. Making the Page component `async` and awaiting data (Hold-First) is the superior pattern.

### ❌ Attempt: Removing Root `Suspense` Boundary

- **Where**: `src/app/layout.tsx`
- **Symptom**: Build failure with `Error: Route "/": Uncached data was accessed outside of <Suspense>`.
- **Root Cause**: In Next.js 16, if a page (like HomePage) or a layout component (like GlobalSchema) accesses dynamic data without being wrapped in a `Suspense` boundary, the build process crashes to prevent "blocking" the entire route during rendering.
- **Lesson**: Always maintain a global `Suspense fallback={null}` in the root layout as a safety net. Performance optimizations should happen by making sub-components synchronous (Shell-First), not by removing the protection layer.

---

## 2. Infrastructure & Build

### ❌ Attempt: Prerendering all products during `next build`

- **Symptom**: Build times exceeding 20 minutes; Docker images ballooning in size; stale data baked into static files.
- **Root Cause**: 7,000+ products in a SQLite DB that isn't even present on the build runner.
- **Solution**: Switch to **Warm-Static Architecture**. Use `generateStaticParams` sparingly or with placeholders during build, and use the `warm-cache` script at runtime.
