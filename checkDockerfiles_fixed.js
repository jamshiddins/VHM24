const fs = require('fs');
const path = require('path');

class DockerConfigChecker {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.fixes = [];
    }

    async checkDockerfiles() {
        
        
        const dockerfilePath = path.join(this.projectRoot, 'Dockerfile');
        if (!fs.existsSync(dockerfilePath)) {
            const dockerfileContent = `FROM node:18-alpine

WORKDIR /app

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

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
`;
            fs.writeFileSync(dockerfilePath, dockerfileContent);
            this.fixes.push('Создан Dockerfile');
        }

        // Проверяем docker-compose
        const dockerComposePath = path.join(this.projectRoot, 'docker-compose.yml');
        if (!fs.existsSync(dockerComposePath)) {
            const dockerComposeContent = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - TELEGRAM_BOT_TOKEN=\${TELEGRAM_BOT_TOKEN}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=vhm24
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=\${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
`;
            fs.writeFileSync(dockerComposePath, dockerComposeContent);
            this.fixes.push('Создан docker-compose.yml');
        }
    }
}

module.exports = DockerConfigChecker;
