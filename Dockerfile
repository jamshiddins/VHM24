# VHM24 Railway Dockerfile
FROM node:20-alpine

# Install OpenSSL and other dependencies
RUN apk add --no-cache openssl libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Install workspace dependencies
RUN npm install --workspaces || true

# Generate Prisma client
RUN cd packages/database && npx prisma generate || true

# Expose port
EXPOSE 8000

# Set environment
ENV NODE_ENV=production
ENV PORT=8000

# Start command
CMD ["npm", "start"]
