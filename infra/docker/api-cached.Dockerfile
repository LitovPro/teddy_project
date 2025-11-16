FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat curl

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy package files first (for better caching)
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/bot/package.json ./apps/bot/
COPY prisma ./prisma/

# Set environment variables
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=development

# Install dependencies (this layer will be cached)
RUN pnpm install --no-frozen-lockfile --registry https://registry.npmmirror.com

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build shared package
RUN pnpm --filter=./packages/shared build

# Build bot
RUN pnpm --filter=./apps/bot build

WORKDIR /app/apps/bot

EXPOSE 3001

# Use development mode for faster startup
CMD ["pnpm", "start:dev"]


