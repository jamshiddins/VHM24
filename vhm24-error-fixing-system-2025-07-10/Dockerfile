FROM node:18-alpine

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Копирование файлов
COPY . .

# Запуск по умолчанию
CMD ["npm", "run", "fix-all"]
