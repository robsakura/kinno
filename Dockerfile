FROM node:22-slim AS base
WORKDIR /app

# System libs needed by both Prisma and Chromium
RUN apt-get update && apt-get install -y \
    openssl \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 \
    libdbus-1-3 libx11-6 libxcb1 libxext6 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build the app + download Chromium for Playwright
FROM deps AS builder
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright-browsers
COPY . .
RUN npx playwright install chromium
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright-browsers
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.playwright-browsers ./.playwright-browsers

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "-c", "npx prisma migrate deploy && exec npm start"]
