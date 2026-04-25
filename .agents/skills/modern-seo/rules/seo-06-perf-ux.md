---
priority: critical
category: technical
---

# SEO Rule: Performance & UX (Core Web Vitals)

Slow sites are penalized by Google.

## The Rule

Pass the Core Web Vitals assessment.

## Metrics

- **LCP (Largest Contentful Paint)**: < 2.5s
  - _Tip_: Preload the hero image.
- **CLS (Cumulative Layout Shift)**: < 0.1
  - _Tip_: Always set `width` and `height` attributes on images.
- **FID (First Input Delay)**: < 100ms
  - _Tip_: Minimize main-thread blocking JS.

## Images

- **Alt Text**: Required for all meaningful images.
- **Format**: Use WebP or AVIF.
- **Sizing**: Use `sizes` attribute for responsive images.

## Checklist

- [ ] Images have `alt` tags?
- [ ] LCP element is preloaded?
