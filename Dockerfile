# See https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# 1) Build dependencies and Next app
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install deps without running postinstall (skips agent uv sync)
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm install --include=dev --ignore-scripts

# Build
COPY . .
RUN npm run build

# 2) Runtime image
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built app and deps
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]
