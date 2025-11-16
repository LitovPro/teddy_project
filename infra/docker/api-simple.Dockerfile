FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy everything
COPY . .

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.0
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# Build packages
RUN pnpm --filter=./packages/shared build
RUN pnpm --filter=./apps/bot build

# Set working directory to bot
WORKDIR /app/apps/bot

EXPOSE 3001

CMD ["pnpm", "start:prod"]


