# ─────────────────────────────────────────────
# ScrollToday Web — Production Docker Image
# ─────────────────────────────────────────────
# Build:
#   docker build -t studio_scrolltoday_com:latest .
#
# Run (mapped to host port 3005):
#   docker run -d \
#     --name studio-scrolltoday-com \
#     -p 3005:3005 \
#     --restart unless-stopped \
#     studio_scrolltoday_com:latest
#
# Note: This image uses 'pnpm preview' to serve the production build,
# which preserves the proxy configurations defined in vite.config.ts.
# ─────────────────────────────────────────────

# --- STAGE 1: Build ---
FROM node:20-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace metadata and manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ad-sdk/package.json ./packages/ad-sdk/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Use .env.development as the primary environment file for the build
# (Vite bakes these into the client-side bundle at build time)
COPY .env.development .env

# Build the project (runs: pnpm --filter @scrolltoday/web build)
RUN pnpm build

# --- STAGE 2: Runner ---
FROM node:20-alpine AS runner

# Set production environment
ENV NODE_ENV=production
ENV PORT=3005

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy necessary manifests and lockfile for dependency installation
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ad-sdk/package.json ./packages/ad-sdk/

# Install dependencies (vite is needed for preview mode)
RUN pnpm install --frozen-lockfile

# Copy the built distribution and necessary configurations
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/web/vite.config.ts ./apps/web/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/.env .env

# Expose the application port
EXPOSE ${PORT}

# Serve the production build
# Using 'preview' ensures that the proxies in vite.config.ts remain active.
# We use sh -c to ensure the $PORT environment variable is interpolated.
CMD ["sh", "-c", "pnpm preview --host 0.0.0.0 --port $PORT"]


