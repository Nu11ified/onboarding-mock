# See https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# 1) Install dependencies only (cached layer)
FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm install --include=dev --ignore-scripts

# 2) Build the Next.js app
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Cache the Next.js build cache between Docker builds
RUN --mount=type=cache,target=/app/.next/cache npm run build

# 3) Runtime image (standalone output — no node_modules needed)
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the standalone server + static assets + public files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# standalone output produces a self-contained server.js
CMD ["node", "server.js"]
