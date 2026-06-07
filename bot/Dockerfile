FROM node:22-bookworm AS base
WORKDIR /app

# Install system dependencies (FFmpeg, librespot, build essentials for node native modules)
RUN apt-get update && apt-get install -y \
  ffmpeg \
  librespot \
  build-essential \
  python3 \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production

FROM base AS development
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
CMD ["node", "dist/index.js"]
