# Stage 1: Base
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Stage 2: Deps
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG BUILD_PHASE=0
ENV BUILD_PHASE=$BUILD_PHASE
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

# Stage 4: Runner (Standard Node for maximum stability)
FROM node:20-alpine AS runner
# Copy bun from official image to a global path
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates sqlite wget libc6-compat nodejs npm
RUN chmod +x /usr/local/bin/bun

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create system group/user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Ensure data directory exists
RUN mkdir -p data && chown nextjs:nodejs data

# 1. Copy full node_modules and src for secondary scripts (Workers/Backups)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# 2. Copy the Next.js website build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Keep container alive forever so Cron Jobs have a home
CMD ["tail", "-f", "/dev/null"]
