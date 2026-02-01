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
# Install sqlite for the DB generation script
RUN apk add --no-cache sqlite bash

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 1. Generate the Lite DB inside the image
# We copy the local master DB (cleverprices.db) into the image first
# Note: Ensure data/cleverprices.db exists locally before building!
RUN chmod +x scripts/database/prepare-lite-db.sh
RUN ./scripts/database/prepare-lite-db.sh

# 2. Build Next.js
RUN bun run build

# Stage 4: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create system group/user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy the standalone build
# Next.js "standalone" output creates a minimal server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the generated Lite DB from the builder stage
# We place it exactly where the app expects it (data/cleverprices-lite.db)
COPY --from=builder --chown=nextjs:nodejs /app/data/cleverprices-lite.db ./data/cleverprices-lite.db

USER nextjs

EXPOSE 3000

CMD ["bun", "server.js"]
