#!/bin/bash
# Скрипт для настройки развертывания и тестирования VHM24
# Этап 3: Развертывание и тестирование

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Проверка наличия необходимых утилит
check_dependencies() {
    log "Проверка наличия необходимых утилит..."
    
    for cmd in docker docker-compose curl wget jq git npm node; do
        if ! command -v $cmd &> /dev/null; then
            error "Утилита $cmd не установлена. Пожалуйста, установите ее и запустите скрипт снова."
        fi
    done
    
    log "Все необходимые утилиты установлены."
}

# 3.1. Настройка CI/CD
setup_cicd() {
    log "Настройка CI/CD..."
    
    # Создание директории для CI/CD
    mkdir -p ./ci-cd
    
    # Создание GitHub Actions workflow для CI/CD
    mkdir -p ./.github/workflows
    
    cat > ./.github/workflows/ci-cd.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linter
      run: npm run lint
      
    - name: Run tests
      run: npm test
      
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Upload build artifacts
      uses: actions/upload-artifact@v2
      with:
        name: build
        path: dist/
        
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master')
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Download build artifacts
      uses: actions/download-artifact@v2
      with:
        name: build
        path: dist/
        
    - name: Set up SSH
      uses: webfactory/ssh-agent@v0.5.3
      with:
        ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
        
    - name: Deploy to production
      run: |
        # Добавление сервера в known_hosts
        ssh-keyscan -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts
        
        # Создание директории на сервере, если она не существует
        ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} "mkdir -p ${{ secrets.DEPLOY_PATH }}"
        
        # Копирование файлов на сервер
        rsync -avz --delete dist/ ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:${{ secrets.DEPLOY_PATH }}
        
        # Перезапуск сервисов
        ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} "cd ${{ secrets.DEPLOY_PATH }} && docker-compose -f docker-compose.production.yml down && docker-compose -f docker-compose.production.yml up -d"
EOF
    
    log "GitHub Actions workflow для CI/CD создан."
    
    # Создание скрипта для автоматического развертывания
    cat > ./ci-cd/deploy.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргументов
if [ $# -ne 1 ]; then
    echo "Использование: $0 <окружение>"
    echo "Окружения: production, staging, development"
    exit 1
fi

ENVIRONMENT=$1
DOCKER_COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Проверка существования файла docker-compose
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "Файл $DOCKER_COMPOSE_FILE не существует."
    exit 1
fi

# Остановка и удаление контейнеров
echo "Остановка и удаление контейнеров..."
docker-compose -f $DOCKER_COMPOSE_FILE down

# Сборка и запуск контейнеров
echo "Сборка и запуск контейнеров..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d --build

echo "Развертывание в окружении $ENVIRONMENT завершено."
EOF
    
    chmod +x ./ci-cd/deploy.sh
    
    log "Скрипт для автоматического развертывания создан."
    
    # Создание скрипта для автоматического обновления
    cat > ./ci-cd/update.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргументов
if [ $# -ne 1 ]; then
    echo "Использование: $0 <окружение>"
    echo "Окружения: production, staging, development"
    exit 1
fi

ENVIRONMENT=$1
DOCKER_COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Проверка существования файла docker-compose
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "Файл $DOCKER_COMPOSE_FILE не существует."
    exit 1
fi

# Получение последних изменений из репозитория
echo "Получение последних изменений из репозитория..."
git pull

# Обновление зависимостей
echo "Обновление зависимостей..."
npm ci

# Сборка проекта
echo "Сборка проекта..."
npm run build

# Перезапуск контейнеров
echo "Перезапуск контейнеров..."
docker-compose -f $DOCKER_COMPOSE_FILE down
docker-compose -f $DOCKER_COMPOSE_FILE up -d --build

echo "Обновление в окружении $ENVIRONMENT завершено."
EOF
    
    chmod +x ./ci-cd/update.sh
    
    log "Скрипт для автоматического обновления создан."
    
    log "Настройка CI/CD завершена."
}

# 3.2. Настройка тестирования
setup_testing() {
    log "Настройка тестирования..."
    
    # Создание директории для тестов
    mkdir -p ./tests/unit
    mkdir -p ./tests/integration
    mkdir -p ./tests/e2e
    mkdir -p ./tests/load
    mkdir -p ./tests/security
    
    # Создание конфигурации Jest для unit-тестов
    cat > ./tests/jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/unit', '<rootDir>/integration'],
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    '../src/**/*.{js,ts}',
    '!../src/**/*.d.ts',
    '!../src/index.{js,ts}',
    '!../src/types/**/*'
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
EOF
    
    log "Конфигурация Jest для unit-тестов создана."
    
    # Создание примера unit-теста
    cat > ./tests/unit/example.test.js << 'EOF'
describe('Example Unit Test', () => {
  test('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF
    
    log "Пример unit-теста создан."
    
    # Создание конфигурации для интеграционных тестов
    cat > ./tests/integration/example.test.js << 'EOF'
describe('Example Integration Test', () => {
  test('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF
    
    log "Пример интеграционного теста создан."
    
    # Создание конфигурации для E2E тестов с использованием Cypress
    mkdir -p ./tests/e2e/cypress
    mkdir -p ./tests/e2e/cypress/integration
    
    cat > ./tests/e2e/cypress.json << 'EOF'
{
  "baseUrl": "http://localhost:3000",
  "viewportWidth": 1280,
  "viewportHeight": 720,
  "video": false,
  "screenshotOnRunFailure": true,
  "screenshotsFolder": "cypress/screenshots",
  "videosFolder": "cypress/videos",
  "integrationFolder": "cypress/integration",
  "supportFile": "cypress/support/index.js",
  "pluginsFile": "cypress/plugins/index.js",
  "fixturesFolder": "cypress/fixtures"
}
EOF
    
    log "Конфигурация Cypress для E2E тестов создана."
    
    # Создание примера E2E теста
    mkdir -p ./tests/e2e/cypress/integration
    
    cat > ./tests/e2e/cypress/integration/example.spec.js << 'EOF'
describe('Example E2E Test', () => {
  it('should visit the home page', () => {
    cy.visit('/');
    cy.contains('VHM24');
  });
});
EOF
    
    log "Пример E2E теста создан."
    
    # Создание конфигурации для нагрузочного тестирования с использованием k6
    mkdir -p ./tests/load/scripts
    
    cat > ./tests/load/scripts/basic-load-test.js << 'EOF'
import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  http.get('http://localhost:3000/api/health');
  sleep(1);
}
EOF
    
    log "Скрипт для нагрузочного тестирования создан."
    
    # Создание конфигурации для тестирования безопасности с использованием OWASP ZAP
    mkdir -p ./tests/security/zap
    
    cat > ./tests/security/zap/zap-scan.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргументов
if [ $# -ne 1 ]; then
    echo "Использование: $0 <url>"
    exit 1
fi

TARGET_URL=$1

# Запуск сканирования с использованием OWASP ZAP
docker run --rm -v $(pwd)/zap-report:/zap/wrk/ owasp/zap2docker-stable zap-baseline.py -t $TARGET_URL -g gen.conf -r zap-report.html

echo "Сканирование безопасности завершено. Отчет сохранен в zap-report/zap-report.html"
EOF
    
    chmod +x ./tests/security/zap/zap-scan.sh
    
    log "Скрипт для тестирования безопасности создан."
    
    log "Настройка тестирования завершена."
}

# 3.3. Настройка оптимизации
setup_optimization() {
    log "Настройка оптимизации..."
    
    # Создание директории для скриптов оптимизации
    mkdir -p ./scripts/optimization
    
    # Создание скрипта для оптимизации базы данных
    cat > ./scripts/optimization/optimize-db.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргументов
if [ $# -ne 1 ]; then
    echo "Использование: $0 <контейнер_базы_данных>"
    exit 1
fi

DB_CONTAINER=$1

# Выполнение VACUUM ANALYZE для оптимизации базы данных
echo "Выполнение VACUUM ANALYZE для оптимизации базы данных..."
docker exec $DB_CONTAINER psql -U vhm24_user -d vhm24_db -c "VACUUM ANALYZE;"

# Обновление статистики
echo "Обновление статистики..."
docker exec $DB_CONTAINER psql -U vhm24_user -d vhm24_db -c "ANALYZE;"

# Проверка и оптимизация индексов
echo "Проверка и оптимизация индексов..."
docker exec $DB_CONTAINER psql -U vhm24_user -d vhm24_db -c "
SELECT
    schemaname,
    relname,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM
    pg_stat_user_indexes
ORDER BY
    idx_scan ASC;
"

echo "Оптимизация базы данных завершена."
EOF
    
    chmod +x ./scripts/optimization/optimize-db.sh
    
    log "Скрипт для оптимизации базы данных создан."
    
    # Создание скрипта для оптимизации API
    cat > ./scripts/optimization/optimize-api.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргументов
if [ $# -ne 1 ]; then
    echo "Использование: $0 <контейнер_api>"
    exit 1
fi

API_CONTAINER=$1

# Проверка производительности API
echo "Проверка производительности API..."
docker exec $API_CONTAINER node --prof-process /tmp/isolate-*.log > api-profile.txt

# Анализ использования памяти
echo "Анализ использования памяти..."
docker exec $API_CONTAINER node --max-old-space-size=4096 /app/node_modules/.bin/clinic doctor -- node /app/dist/index.js

echo "Оптимизация API завершена. Результаты сохранены в api-profile.txt"
EOF
    
    chmod +x ./scripts/optimization/optimize-api.sh
    
    log "Скрипт для оптимизации API создан."
    
    # Создание скрипта для настройки кэширования с использованием Redis
    cat > ./scripts/optimization/setup-redis.sh << 'EOF'
#!/bin/bash

# Создание конфигурации Redis
cat > ./redis.conf << 'EOFREDIS'
# Redis configuration file

# General
daemonize no
pidfile /var/run/redis/redis-server.pid
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Append only mode
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes

# Lua scripting
lua-time-limit 5000

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency monitor
latency-monitor-threshold 0

# Event notification
notify-keyspace-events ""

# Advanced config
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit slave 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
aof-rewrite-incremental-fsync yes
EOFREDIS

# Создание docker-compose.yml для Redis
cat > ./docker-compose.redis.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]
    networks:
      - vhm24-network

networks:
  vhm24-network:
    external: true
EOF

echo "Настройка Redis завершена. Для запуска выполните: docker-compose -f docker-compose.redis.yml up -d"
EOF
    
    chmod +x ./scripts/optimization/setup-redis.sh
    
    log "Скрипт для настройки кэширования с использованием Redis создан."
    
    log "Настройка оптимизации завершена."
}

# Основная функция
main() {
    log "Начало настройки развертывания и тестирования VHM24..."
    
    check_dependencies
    setup_cicd
    setup_testing
    setup_optimization
    
    log "Настройка развертывания и тестирования VHM24 завершена."
    log "Пожалуйста, отредактируйте созданные файлы конфигурации, заменив значения по умолчанию на реальные."
    log "Для запуска CI/CD pipeline, настройте GitHub Actions в вашем репозитории."
    log "Для запуска тестов выполните следующие команды:"
    log "1. cd ./tests && npm test (для unit и интеграционных тестов)"
    log "2. cd ./tests/e2e && npx cypress run (для E2E тестов)"
    log "3. cd ./tests/load && k6 run scripts/basic-load-test.js (для нагрузочных тестов)"
    log "4. cd ./tests/security && ./zap/zap-scan.sh http://localhost:3000 (для тестов безопасности)"
}

# Запуск основной функции
main
