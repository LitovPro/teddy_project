FROM node:20-alpine

WORKDIR /app

# Install system dependencies including Python for native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_OPTIONS="--max-old-space-size=1024"

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

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.0

# Install dependencies with optimizations
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build packages with memory optimization
RUN pnpm --filter=./packages/shared build
RUN pnpm --filter=./apps/bot build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Set permissions
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "apps/bot/dist/main"]

