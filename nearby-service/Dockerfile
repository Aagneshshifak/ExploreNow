# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client
RUN npm ci
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Set env to production
ENV NODE_ENV=production

# Expose HTTP and gRPC ports
EXPOSE 3000
EXPOSE 50051

CMD ["npm", "start"]
