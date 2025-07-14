FROM node:16-alpine

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Генерация Prisma клиента
RUN npx prisma generate

# Порт для API
EXPOSE 3000

# Запуск приложения
CMD ["npm", "start"]