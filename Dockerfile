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

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Stage 3: Builder
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

RUN --mount=type=cache,target=/app/.next/cache \
    BUILD_PHASE=1 bun run build

# Stage 4: Production Runner (Unified & Optimized)
FROM base AS worker-runner
WORKDIR /app
RUN apk add --no-cache ca-certificates sqlite libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Setup system user and directories
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p data && chown nextjs:nodejs /app/data

# 1. Copy Web Stack (Standalone)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 2. Copy Automation Stack (Scripts & Full Node Modules)
# We use the full modules from the 'deps' stage to ensure all scripts (including toolsets) are available
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000

# Start the web server to keep the container alive for schedules
CMD ["bun", "server.js"]
