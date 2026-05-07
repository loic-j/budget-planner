# ---- Build stage ----
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate && npm install -g esbuild
RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all deps (including devDeps: prisma CLI, typescript, vite, etc.)
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Generate Prisma client for Linux (Alpine)
RUN pnpm --filter @app/api exec prisma generate

# Build web app — outputs to apps/api/public (via vite.config outDir)
RUN pnpm --filter @app/web exec vite build

# Bundle server.ts with esbuild:
#   --bundle       : inline all local source into one file
#   --packages=external : keep npm packages as external imports (resolved from node_modules at runtime)
#   --platform=node: handle Node.js built-ins correctly
RUN cd apps/api && esbuild src/server.ts \
    --bundle \
    --packages=external \
    --platform=node \
    --format=esm \
    --target=esnext \
    --outfile=dist/server.js

# ---- Production stage ----
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
# Install openssl so Prisma detects the right binary target (Alpine uses OpenSSL 3)
RUN apk add --no-cache openssl
# Install prisma CLI globally for migrations at startup
RUN npm install -g prisma@5.22.0

WORKDIR /app

ENV NODE_ENV=production

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy bundled server entry
COPY --from=builder /app/apps/api/dist/server.js ./apps/api/dist/server.js

# Copy built frontend static files
COPY --from=builder /app/apps/api/public ./apps/api/public

# Copy Prisma schema (needed for generate + migrate deploy)
COPY apps/api/prisma ./apps/api/prisma

# Generate Prisma client, then copy it into the pnpm store location that Node
# resolves at runtime (pnpm symlinks cause a different path than the root
# node_modules/.prisma/client where prisma generate writes by default)
RUN prisma generate --schema=apps/api/prisma/schema.prisma && \
    PRISMA_STORE=$(find /app/node_modules/.pnpm -maxdepth 1 -name '@prisma+client@*' -type d | head -1) && \
    cp -rf /app/node_modules/.prisma/client "$PRISMA_STORE/node_modules/.prisma/client"

WORKDIR /app/apps/api

EXPOSE 3000

# Apply migrations then start server
CMD ["sh", "-c", "prisma migrate deploy --schema=prisma/schema.prisma && node dist/server.js"]
