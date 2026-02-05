# Stage 1: Base
FROM oven/bun:1-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Stage 2: Deps (Install all dependencies for building)
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json bun.lock ./

# Skip heavy Chromium download during build
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN bun install --frozen-lockfile

# Stage 3: Prod-Deps (Minimal production dependencies for the Web App)
FROM base AS prod-deps
COPY package.json bun.lock ./
# We skip puppeteer/playwright/etc. by using --production
RUN bun install --production --frozen-lockfile

# Stage 4: Worker-Deps (Include scraping tools for the Worker)
FROM base AS worker-deps
COPY package.json bun.lock ./
# Note: For the worker, we might actually need some devDeps like puppeteer 
# but for now we'll assume production deps are enough if they are in 'dependencies'
# If they are in 'devDependencies', we'd need a different install.
RUN bun install --production --frozen-lockfile

# Stage 5: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG BUILD_PHASE=0
ENV BUILD_PHASE=$BUILD_PHASE
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Create data directory for build-time DB analysis fallback
RUN mkdir -p data
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

RUN BUILD_PHASE=1 bun run build

# Stage 6: Web-Runner (ULTRA LEAN - ~200MB)
FROM base AS runner
WORKDIR /app

# Install runtime dependencies (sqlite, ca-certificates)
RUN apk add --no-cache ca-certificates sqlite libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create system group/user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Ensure data directory exists
RUN mkdir -p data && chown nextjs:nodejs data

# 1. Copy ONLY the standalone Next.js build
# Standalone includes its own minimal node_modules with only what's needed for the web server
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Start using the standalone server.js (Next.js Web App)
CMD ["bun", "server.js"]

# Stage 7: Worker-Runner (Includes Scraping Tools - ~800MB)
FROM base AS worker-runner
WORKDIR /app
RUN apk add --no-cache ca-certificates sqlite libc6-compat

ENV NODE_ENV=production

# Copy production node_modules (including worker tools)
COPY --from=worker-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Setup for Web Server (allows consolidation)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Setup user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

# Default command: Start the web server to keep the container alive for schedules
CMD ["bun", "server.js"]
