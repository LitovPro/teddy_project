FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Set environment variables
ENV NODE_ENV=production

# Copy package files first for better caching
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin/package.json ./apps/admin/

# Create .npmrc for faster downloads
RUN echo "registry=https://registry.npmjs.org/" > .npmrc && \
    echo "fetch-retries=3" >> .npmrc && \
    echo "fetch-retry-mintimeout=5000" >> .npmrc && \
    echo "fetch-retry-maxtimeout=60000" >> .npmrc

# Install dependencies using npm (more reliable than pnpm in Docker)
RUN npm install -g pnpm@8.15.0 && \
    pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build packages
RUN pnpm --filter=./packages/shared build
RUN pnpm --filter=./apps/admin build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "--filter=./apps/admin", "start"]
