---
description: Deploy the application to production securely using Dokploy
---

# 🚀 Deploy to Production

## 🚀 Automated Deployment

We now use a single command to handle the entire pipeline from testing to verification.

```bash
bun run deploy
```

### What this command does:

1.  **Pre-flight Checks**: Runs `typecheck`, `lint`, and our new **Playwright E2E tests**.
2.  **Git Sync**: Automatically commits and pushes to `main`.
3.  **Deployment Truth Verification**: Polls the production URL and checks the `X-Build-ID` header.
    - It will wait for up to 10 minutes for the new version to serve.
    - It only finishes when the production hash matches your local commit hash.
4.  **Cache Warming**: Automatically runs `warm-cache --lite` once verified.

5.  **Proactive Cache Warming**
    After the deployment is live, trigger a site-wide warm cycle to ensure instant load times and immediate price consistency across all pages.
    ```bash
    bun run warm-cache --lite
    ```
