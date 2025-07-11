# VHM24 - Комплексное решение проблем совместимости

## Проблемы и решения

### 1. Проблемы с Node.js 22.17.0

Некоторые пакеты (fast-jwt, canvas) не совместимы с Node.js 22.17.0. Решения:

- Использование Docker с Node.js 18
- Замена fast-jwt на jsonwebtoken
- Замена canvas на skia-canvas

### 2. Проблемы с тестами

Тесты используют tap, который не совместим с текущей конфигурацией. Решение:

- Конвертация тестов в Jest

## Инструкции по запуску

### Вариант 1: Запуск в Docker (рекомендуется)

Этот вариант обеспечивает изолированную среду с совместимой версией Node.js и всеми зависимостями.

```bash
# Linux/macOS
./run-in-docker.sh

# Windows
run-in-docker.bat
```

### Вариант 2: Запуск всех исправлений

Этот вариант исправляет все проблемы и запускает проект в Docker.

```bash
# Linux/macOS
./run-all-fixes.sh

# Windows
run-all-fixes.bat
```

### Вариант 3: Ручное исправление

Если вы хотите исправить проблемы вручную:

1. Исправление импортов fast-jwt:

```bash
node scripts/fix-fast-jwt.js
```

2. Исправление импортов canvas:

```bash
node scripts/fix-canvas.js
```

3. Исправление тестов:

```bash
node scripts/fix-dependencies.js
```

4. Запуск проекта:

```bash
node start-optimized.js
```

## Дополнительная информация

### Структура Docker-контейнера

- Node.js 18 Alpine
- PostgreSQL 14
- Redis Alpine

### Порты

- 8000: API Gateway
- 3001-3004: Микросервисы
- 5432: PostgreSQL
- 6379: Redis

### Тома

- postgres-data: Данные PostgreSQL
- redis-data: Данные Redis
