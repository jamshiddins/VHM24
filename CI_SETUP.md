# 🚀 Настройка CI/CD для проекта VHM24

## 📋 Обзор

Этот документ содержит инструкции по настройке CI/CD (Continuous Integration/Continuous Deployment) для проекта VHM24 с использованием GitHub Actions и Railway.

## 🔧 Настройка GitHub Actions

### 1. Создание секретов в GitHub

Для работы CI/CD необходимо добавить следующие секреты в настройках репозитория GitHub:

1. Откройте репозиторий на GitHub
2. Перейдите в Settings → Secrets and variables → Actions
3. Нажмите "New repository secret"
4. Добавьте следующие секреты:

| Имя секрета | Описание | Пример значения |
|-------------|----------|-----------------|
| `RAILWAY_TOKEN` | Токен для доступа к Railway | `c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8` |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | `8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ` |
| `WEBHOOK_URL` | URL для вебхука Telegram | `https://web-production-73916.up.railway.app/api/telegram/webhook` |
| `RAILWAY_PUBLIC_URL` | Публичный URL приложения | `https://web-production-73916.up.railway.app` |
| `TELEGRAM_CHAT_ID` | ID чата для уведомлений | `42283329` |

### 2. Настройка файла конфигурации GitHub Actions

Файл конфигурации GitHub Actions уже создан и находится в `.github/workflows/deploy.yml`. Он содержит следующие этапы:

1. **Test**: Запуск тестов
   - Запуск PostgreSQL и Redis в контейнерах Docker
   - Установка зависимостей
   - Генерация Prisma клиента
   - Запуск тестов

2. **Deploy**: Деплой на Railway
   - Установка Railway CLI
   - Деплой на Railway
   - Настройка вебхука Telegram
   - Проверка работоспособности

3. **Notify**: Отправка уведомлений
   - Отправка уведомления об успешном деплое
   - Отправка уведомления об ошибке деплоя

## 🔑 Получение токена Railway

Для получения токена Railway выполните следующие шаги:

1. Установите Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Войдите в Railway:
   ```bash
   railway login
   ```

3. Получите токен:
   ```bash
   railway whoami --token
   ```

4. Скопируйте полученный токен и добавьте его в секреты GitHub.

## 📱 Получение токена Telegram бота

Для получения токена Telegram бота выполните следующие шаги:

1. Откройте BotFather в Telegram: https://t.me/BotFather
2. Отправьте команду `/newbot` и следуйте инструкциям
3. После создания бота вы получите токен
4. Скопируйте полученный токен и добавьте его в секреты GitHub

## 💬 Получение ID чата для уведомлений

Для получения ID чата для уведомлений выполните следующие шаги:

1. Откройте бота @userinfobot в Telegram: https://t.me/userinfobot
2. Отправьте любое сообщение
3. Бот ответит вам с вашим ID
4. Скопируйте полученный ID и добавьте его в секреты GitHub

## 🚀 Запуск CI/CD

После настройки секретов и файла конфигурации GitHub Actions, CI/CD будет запускаться автоматически при каждом пуше в ветку `main` или при создании Pull Request в ветку `main`.

Вы также можете запустить CI/CD вручную:

1. Откройте репозиторий на GitHub
2. Перейдите в Actions
3. Выберите "Deploy to Railway"
4. Нажмите "Run workflow"
5. Выберите ветку и нажмите "Run workflow"

## 📊 Мониторинг CI/CD

Вы можете мониторить выполнение CI/CD в разделе Actions на GitHub:

1. Откройте репозиторий на GitHub
2. Перейдите в Actions
3. Выберите "Deploy to Railway"
4. Выберите конкретный запуск для просмотра деталей

## 🔍 Отладка CI/CD

Если CI/CD завершается с ошибкой, вы можете посмотреть логи для отладки:

1. Откройте репозиторий на GitHub
2. Перейдите в Actions
3. Выберите "Deploy to Railway"
4. Выберите конкретный запуск
5. Выберите этап, на котором произошла ошибка
6. Просмотрите логи

## 📝 Рекомендации по работе с CI/CD

1. **Всегда запускайте тесты локально перед пушем в репозиторий**:
   ```bash
   npm test
   ```

2. **Используйте ветки для разработки**:
   ```bash
   git checkout -b feature/new-feature
   ```

3. **Создавайте Pull Request для слияния изменений в ветку `main`**:
   ```bash
   git push origin feature/new-feature
   ```

4. **Проверяйте статус CI/CD перед слиянием Pull Request**:
   - Убедитесь, что все тесты проходят
   - Убедитесь, что деплой выполняется успешно

5. **Используйте семантические коммиты**:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: fix bug in feature"
   git commit -m "docs: update documentation"
   git commit -m "test: add tests for feature"
   git commit -m "refactor: refactor feature"
   ```

## 📈 Дальнейшие улучшения CI/CD

1. **Добавление этапа сборки**:
   ```yaml
   build:
     name: Build
     runs-on: ubuntu-latest
     steps:
       - name: Checkout code
         uses: actions/checkout@v3
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '16.x'
           cache: 'npm'
       - name: Install dependencies
         run: npm ci
       - name: Build
         run: npm run build
   ```

2. **Добавление этапа линтинга**:
   ```yaml
   lint:
     name: Lint
     runs-on: ubuntu-latest
     steps:
       - name: Checkout code
         uses: actions/checkout@v3
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '16.x'
           cache: 'npm'
       - name: Install dependencies
         run: npm ci
       - name: Lint
         run: npm run lint
   ```

3. **Добавление этапа проверки типов**:
   ```yaml
   typecheck:
     name: Typecheck
     runs-on: ubuntu-latest
     steps:
       - name: Checkout code
         uses: actions/checkout@v3
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '16.x'
           cache: 'npm'
       - name: Install dependencies
         run: npm ci
       - name: Typecheck
         run: npm run typecheck
   ```

4. **Добавление этапа проверки безопасности**:
   ```yaml
   security:
     name: Security
     runs-on: ubuntu-latest
     steps:
       - name: Checkout code
         uses: actions/checkout@v3
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '16.x'
           cache: 'npm'
       - name: Install dependencies
         run: npm ci
       - name: Security
         run: npm audit
   ```

5. **Добавление этапа проверки производительности**:
   ```yaml
   performance:
     name: Performance
     runs-on: ubuntu-latest
     steps:
       - name: Checkout code
         uses: actions/checkout@v3
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '16.x'
           cache: 'npm'
       - name: Install dependencies
         run: npm ci
       - name: Performance
         run: npm run performance
   ```

## 📝 Заключение

Настройка CI/CD позволяет автоматизировать процесс тестирования, сборки и деплоя приложения, что сокращает время на рутинные операции и уменьшает вероятность ошибок. Следуйте рекомендациям по работе с CI/CD для обеспечения стабильной работы приложения.
