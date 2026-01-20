# Bundle Analysis

This project includes `@next/bundle-analyzer` for analyzing JavaScript bundle sizes.

## Usage

### For Turbopack (Modern - Default)

Since this project uses Turbopack, use the built-in experimental analyzer:

```bash
bun x next experimental-analyze
```

### For Webpack (Legacy)

If you explicitly want to use the classic `@next/bundle-analyzer`:

```bash
ANALYZE=true bun run build --webpack
```

This will:

1. Generate a production build using the Webpack engine
2. Open interactive bundle visualizations in your browser
3. Save reports to `.next/analyze/`

## What to Look For

### ❌ Red Flags

| Issue                           | Impact            | Solution               |
| ------------------------------- | ----------------- | ---------------------- |
| Large node_modules chunks       | Slow initial load | Dynamic imports        |
| Duplicate dependencies          | Wasted bytes      | Check package versions |
| Heavy icons (full lucide-react) | Bundle bloat      | Direct imports         |
| Unused code in chunks           | Wasted bytes      | Tree shaking           |

### ✅ Healthy Signs

- Main bundle < 100KB gzipped
- Per-route chunks < 50KB
- No duplicate dependencies
- Third-party code in separate chunks

## Targets

| Bundle          | Target Size  | Notes               |
| --------------- | ------------ | ------------------- |
| Main (shared)   | < 100KB gzip | Core React, layout  |
| Per-route chunk | < 50KB gzip  | Route-specific code |
| Total JS        | < 300KB gzip | All JavaScript      |

## When to Run

- Before major deploys
- After adding new dependencies
- When PageSpeed JS score drops
