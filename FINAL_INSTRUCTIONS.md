# Финальные инструкции по запуску VHM24

## Исправленные проблемы

### 1. Проблема с файлом .env

Исправлена проблема с некорректными шаблонами в файле .env, которые вызывали ошибку:

```
failed to read D:\Projects\VHM24\.env: Invalid template: "${process.env.URL_85}"
```

### 2. Проблемы с зависимостями

Исправлены проблемы с несовместимыми зависимостями:

- fast-jwt заменен на jsonwebtoken
- canvas заменен на skia-canvas

### 3. Проблемы с Node.js 22.17.0

Создана Docker-конфигурация с Node.js 18, которая полностью совместима со всеми зависимостями
проекта.

### 4. Проблемы с тестами

- Созданы моки для проблемных модулей (canvas, fast-jwt)
- Обновлена конфигурация Jest для игнорирования проблемных модулей
- Созданы базовые тесты для всех сервисов

## Финальные скрипты запуска

Созданы новые скрипты, которые автоматически исправляют все проблемы и запускают тесты:

### Для PowerShell (Windows)

```powershell
# Запуск всех исправлений, тестов и запуск в Docker
./run-all-fixes-final.ps1
```

### Для Bash (Linux/macOS)

```bash
# Запуск всех исправлений, тестов и запуск в Docker
./run-all-fixes-final.sh
```

### Для CMD (Windows)

```cmd
# Запуск всех исправлений, тестов и запуск в Docker
run-all-fixes-final.bat
```

## Запуск отдельных скриптов исправления

Если вы хотите запустить отдельные скрипты исправления:

### 1. Исправление файла .env

```bash
node scripts/fix-env.js
```

### 2. Исправление импортов fast-jwt

```bash
node scripts/fix-fast-jwt.js
```

### 3. Исправление импортов canvas

```bash
node scripts/fix-canvas.js
```

### 4. Исправление тестов

```bash
node scripts/fix-tests.js
```

## Запуск тестов

Для запуска тестов выполните:

```bash
npm test
```

## Запуск в Docker

Для запуска в Docker выполните:

```bash
docker-compose -f docker-compose.compatible.yml down
docker-compose -f docker-compose.compatible.yml up --build
```

## Важное замечание

Из-за несовместимости Node.js 22.17.0 с некоторыми пакетами (fast-jwt, skia-canvas), настоятельно
рекомендуется использовать Docker для запуска проекта. Docker-контейнер использует Node.js 18,
который полностью совместим со всеми зависимостями проекта.

## Структура проекта

- `scripts/` - скрипты для исправления проблем
  - `fix-env.js` - исправление файла .env
  - `fix-fast-jwt.js` - исправление импортов fast-jwt
  - `fix-canvas.js` - исправление импортов canvas
  - `fix-tests.js` - исправление тестов
- `mocks/` - моки для проблемных модулей
  - `canvas.js` - мок для canvas
  - `jwt.js` - мок для JWT
- `tests/` - тесты для сервисов
  - `example/` - пример теста
  - `auth/`, `tasks/`, и т.д. - тесты для каждого сервиса
- `docker-compose.compatible.yml` - Docker Compose конфигурация с совместимой версией Node.js
- `Dockerfile.compatible` - Dockerfile с совместимой версией Node.js
