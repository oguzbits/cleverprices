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

# Install Litestream and dependencies
RUN apk add --no-cache ca-certificates sqlite wget libc6-compat nodejs

RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then L_ARCH="amd64"; elif [ "$ARCH" = "aarch64" ]; then L_ARCH="arm64"; fi && \
    wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-${L_ARCH}.tar.gz -O /tmp/litestream.tar.gz && \
    tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz && \
    rm /tmp/litestream.tar.gz

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

# Copy the standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/litestream.yml ./litestream.yml

# Copy startup script
COPY --chown=nextjs:nodejs scripts/deploy/start.sh /app/start.sh
RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

# Use isolated startup script
ENTRYPOINT ["/app/start.sh"]
# Explicitly empty CMD to prevent Dokploy/Docker from appending defaults
CMD []
