# Stage 1: Base
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Stage 2: Deps
FROM base AS deps
# Install libc6-compat for some native addons if needed
RUN apk add --no-cache libc6-compat
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 1. Build Next.js
RUN bun run build

# Stage 4: Runner
FROM base AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates sqlite wget libc6-compat nodejs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create system group/user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Ensure data directory exists for volumes
RUN mkdir -p data && chown nextjs:nodejs data

# Copy public assets
COPY --from=builder /app/public ./public

# Copy dependencies and source for scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

# Copy the standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy automation scripts for workers and backups
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts


USER nextjs

EXPOSE 3000

ENV CACHE_BUST=1


# Direct startup for maximum stability
CMD ["node", "server.js"]
