# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm install
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

# Copy package files and install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate

# Copy built code from builder (includes proto files via build script)
COPY --from=builder /app/dist ./dist

# Set env to production
ENV NODE_ENV=production

# Cap heap to avoid OOM crashes on memory-constrained instances (Render free tier ~512MB)
ENV NODE_OPTIONS="--max-old-space-size=400"

# Expose HTTP and gRPC ports
EXPOSE 10000
EXPOSE 50051

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/health || exit 1

# Push schema to DB then start the server
CMD npx prisma db push --skip-generate && npm start
