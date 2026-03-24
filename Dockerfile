FROM node:22-slim AS base
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build the app
FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "-c", "npx prisma migrate deploy && exec npm start"]
