FROM node:18-alpine

WORKDIR /app

# Копирование исходного кода
COPY . .

# Создание директорий для логов и загрузок
RUN mkdir -p logs uploads

# Установка зависимостей
RUN npm ci --only=production

# Генерация Prisma клиента
RUN cd backend && npx prisma generate

# Порт для API
EXPOSE 3000

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Запуск приложения
CMD ["npm", "start"]
