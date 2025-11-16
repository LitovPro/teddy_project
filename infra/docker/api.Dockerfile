FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy package files first for better caching
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/bot/package.json ./apps/bot/
COPY prisma ./prisma/

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

# Generate Prisma client and build packages
RUN pnpm prisma generate && \
    pnpm --filter=./packages/shared build && \
    pnpm --filter=./apps/bot build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Set permissions
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

ENV PORT=3001

CMD ["node", "apps/bot/dist/main"]