FROM node:20-alpine

WORKDIR /app

# Install necessary packages for node-gyp and Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install root dependencies
RUN npm ci

# Copy all source code
COPY . .

# Install backend dependencies and generate Prisma client
RUN cd backend && npm ci && npx prisma generate

# Expose port
EXPOSE 8000

# Set environment
ENV NODE_ENV=production
ENV PORT=8000

# Start application using our start.js script
CMD ["npm", "start"]
