FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY apps/telegram-bot/package*.json ./apps/telegram-bot/

# Install dependencies
RUN npm ci --only=production
RUN cd backend && npm ci --only=production
RUN cd apps/telegram-bot && npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN cd backend && npx prisma generate

# Create uploads directory
RUN mkdir -p uploads logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start command
CMD ["npm", "start"]
