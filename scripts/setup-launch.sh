#!/bin/bash
# Скрипт для запуска и поддержки VHM24
# Этап 5: Запуск и поддержка

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
    
    for cmd in docker docker-compose curl wget jq; do
        if ! command -v $cmd &> /dev/null; then
            error "Утилита $cmd не установлена. Пожалуйста, установите ее и запустите скрипт снова."
        fi
    done
    
    log "Все необходимые утилиты установлены."
}

# 5.1. Финальная проверка готовности
check_readiness() {
    log "Финальная проверка готовности..."
    
    # Проверка наличия необходимых файлов
    log "Проверка наличия необходимых файлов..."
    
    required_files=(
        "docker-compose.production.yml"
        ".env"
        "data/nginx/conf.d/default.conf"
        "data/nginx/ssl/fullchain.pem"
        "data/nginx/ssl/privkey.pem"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            warn "Файл $file не найден."
        else
            log "Файл $file найден."
        fi
    done
    
    # Проверка наличия необходимых директорий
    log "Проверка наличия необходимых директорий..."
    
    required_dirs=(
        "data/api"
        "data/db"
        "data/bot"
        "data/nginx"
        "data/redis"
        "logs"
        "monitoring"
        "logging"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            warn "Директория $dir не найдена."
        else
            log "Директория $dir найдена."
        fi
    done
    
    # Проверка переменных окружения
    log "Проверка переменных окружения..."
    
    required_env_vars=(
        "DB_USER"
        "DB_PASSWORD"
        "DB_NAME"
        "JWT_SECRET"
        "BOT_TOKEN"
        "WEBHOOK_URL"
    )
    
    if [ -f ".env" ]; then
        for var in "${required_env_vars[@]}"; do
            if ! grep -q "^$var=" .env; then
                warn "Переменная окружения $var не найдена в файле .env."
            else
                log "Переменная окружения $var найдена в файле .env."
            fi
        done
    else
        warn "Файл .env не найден."
    fi
    
    # Проверка доступности портов
    log "Проверка доступности портов..."
    
    required_ports=(
        80
        443
        3000
        5432
        6379
        9090
        9100
        8080
        3001
        5601
        9200
        9300
        5000
        9600
    )
    
    for port in "${required_ports[@]}"; do
        if lsof -i :$port > /dev/null 2>&1; then
            warn "Порт $port уже используется."
        else
            log "Порт $port доступен."
        fi
    done
    
    log "Финальная проверка готовности завершена."
}

# 5.2. Запуск системы
launch_system() {
    log "Запуск системы..."
    
    # Запуск системы
    log "Запуск контейнеров..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Проверка статуса контейнеров
    log "Проверка статуса контейнеров..."
    docker-compose -f docker-compose.production.yml ps
    
    # Проверка логов контейнеров
    log "Проверка логов контейнеров..."
    docker-compose -f docker-compose.production.yml logs --tail=10
    
    # Запуск мониторинга
    log "Запуск мониторинга..."
    cd ./monitoring && docker-compose up -d && cd ..
    
    # Проверка статуса контейнеров мониторинга
    log "Проверка статуса контейнеров мониторинга..."
    cd ./monitoring && docker-compose ps && cd ..
    
    # Запуск логирования
    log "Запуск логирования..."
    cd ./logging && docker-compose up -d && cd ..
    
    # Проверка статуса контейнеров логирования
    log "Проверка статуса контейнеров логирования..."
    cd ./logging && docker-compose ps && cd ..
    
    log "Запуск системы завершен."
}

# 5.3. Мониторинг работы системы
monitor_system() {
    log "Мониторинг работы системы..."
    
    # Проверка доступности API
    log "Проверка доступности API..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
        log "API доступен."
    else
        warn "API недоступен."
    fi
    
    # Проверка доступности веб-интерфейса
    log "Проверка доступности веб-интерфейса..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
        log "Веб-интерфейс доступен."
    else
        warn "Веб-интерфейс недоступен."
    fi
    
    # Проверка доступности Prometheus
    log "Проверка доступности Prometheus..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:9090 | grep -q "200"; then
        log "Prometheus доступен."
    else
        warn "Prometheus недоступен."
    fi
    
    # Проверка доступности Grafana
    log "Проверка доступности Grafana..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
        log "Grafana доступен."
    else
        warn "Grafana недоступен."
    fi
    
    # Проверка доступности Kibana
    log "Проверка доступности Kibana..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5601 | grep -q "200"; then
        log "Kibana доступен."
    else
        warn "Kibana недоступен."
    fi
    
    # Проверка доступности Elasticsearch
    log "Проверка доступности Elasticsearch..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:9200 | grep -q "200"; then
        log "Elasticsearch доступен."
    else
        warn "Elasticsearch недоступен."
    fi
    
    log "Мониторинг работы системы завершен."
}

# 5.4. Поддержка системы
support_system() {
    log "Настройка поддержки системы..."
    
    # Создание скрипта для проверки состояния системы
    cat > ./scripts/check-system-status.sh << 'EOF'
#!/bin/bash

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
}

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
docker-compose -f docker-compose.production.yml ps

# Проверка использования ресурсов
log "Проверка использования ресурсов..."
docker stats --no-stream

# Проверка логов контейнеров
log "Проверка логов контейнеров..."
docker-compose -f docker-compose.production.yml logs --tail=10

# Проверка доступности API
log "Проверка доступности API..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
    log "API доступен."
else
    error "API недоступен."
fi

# Проверка доступности веб-интерфейса
log "Проверка доступности веб-интерфейса..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    log "Веб-интерфейс доступен."
else
    error "Веб-интерфейс недоступен."
fi

# Проверка доступности Prometheus
log "Проверка доступности Prometheus..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9090 | grep -q "200"; then
    log "Prometheus доступен."
else
    error "Prometheus недоступен."
fi

# Проверка доступности Grafana
log "Проверка доступности Grafana..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
    log "Grafana доступен."
else
    error "Grafana недоступен."
fi

# Проверка доступности Kibana
log "Проверка доступности Kibana..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5601 | grep -q "200"; then
    log "Kibana доступен."
else
    error "Kibana недоступен."
fi

# Проверка доступности Elasticsearch
log "Проверка доступности Elasticsearch..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9200 | grep -q "200"; then
    log "Elasticsearch доступен."
else
    error "Elasticsearch недоступен."
fi

log "Проверка состояния системы завершена."
EOF
    
    chmod +x ./scripts/check-system-status.sh
    
    log "Скрипт для проверки состояния системы создан."
    
    # Создание скрипта для перезапуска системы
    cat > ./scripts/restart-system.sh << 'EOF'
#!/bin/bash

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

# Остановка системы
log "Остановка системы..."
docker-compose -f docker-compose.production.yml down

# Остановка мониторинга
log "Остановка мониторинга..."
cd ./monitoring && docker-compose down && cd ..

# Остановка логирования
log "Остановка логирования..."
cd ./logging && docker-compose down && cd ..

# Запуск системы
log "Запуск системы..."
docker-compose -f docker-compose.production.yml up -d

# Запуск мониторинга
log "Запуск мониторинга..."
cd ./monitoring && docker-compose up -d && cd ..

# Запуск логирования
log "Запуск логирования..."
cd ./logging && docker-compose up -d && cd ..

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
docker-compose -f docker-compose.production.yml ps

log "Перезапуск системы завершен."
EOF
    
    chmod +x ./scripts/restart-system.sh
    
    log "Скрипт для перезапуска системы создан."
    
    # Создание скрипта для создания резервной копии
    cat > ./scripts/backup-system.sh << 'EOF'
#!/bin/bash

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

# Создание директории для резервных копий
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"

mkdir -p $BACKUP_DIR

# Создание резервной копии базы данных
log "Создание резервной копии базы данных..."
./scripts/db/backup.sh

# Создание резервной копии файлов
log "Создание резервной копии файлов..."
tar -czf $BACKUP_FILE \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="backups" \
    --exclude="data/db" \
    --exclude="logs" \
    .

log "Резервная копия создана: $BACKUP_FILE"
EOF
    
    chmod +x ./scripts/backup-system.sh
    
    log "Скрипт для создания резервной копии создан."
    
    # Создание скрипта для восстановления из резервной копии
    cat > ./scripts/restore-system.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргументов
if [ $# -ne 1 ]; then
    echo "Использование: $0 <путь_к_файлу_резервной_копии>"
    exit 1
fi

BACKUP_FILE=$1

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

# Проверка существования файла
if [ ! -f "$BACKUP_FILE" ]; then
    error "Файл $BACKUP_FILE не существует."
fi

# Остановка системы
log "Остановка системы..."
docker-compose -f docker-compose.production.yml down

# Остановка мониторинга
log "Остановка мониторинга..."
cd ./monitoring && docker-compose down && cd ..

# Остановка логирования
log "Остановка логирования..."
cd ./logging && docker-compose down && cd ..

# Создание временной директории
TEMP_DIR="./temp_restore"
mkdir -p $TEMP_DIR

# Распаковка резервной копии
log "Распаковка резервной копии..."
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Копирование файлов
log "Копирование файлов..."
cp -r $TEMP_DIR/* .

# Удаление временной директории
log "Удаление временной директории..."
rm -rf $TEMP_DIR

# Восстановление базы данных
log "Восстановление базы данных..."
DB_BACKUP=$(ls -t ./backups/backup_*.sql.gz | head -1)
if [ -f "$DB_BACKUP" ]; then
    ./scripts/db/restore.sh $DB_BACKUP
else
    warn "Резервная копия базы данных не найдена."
fi

# Запуск системы
log "Запуск системы..."
docker-compose -f docker-compose.production.yml up -d

# Запуск мониторинга
log "Запуск мониторинга..."
cd ./monitoring && docker-compose up -d && cd ..

# Запуск логирования
log "Запуск логирования..."
cd ./logging && docker-compose up -d && cd ..

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
docker-compose -f docker-compose.production.yml ps

log "Восстановление системы завершено."
EOF
    
    chmod +x ./scripts/restore-system.sh
    
    log "Скрипт для восстановления из резервной копии создан."
    
    # Создание скрипта для обновления системы
    cat > ./scripts/update-system.sh << 'EOF'
#!/bin/bash

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

# Создание резервной копии перед обновлением
log "Создание резервной копии перед обновлением..."
./scripts/backup-system.sh

# Получение последних изменений из репозитория
log "Получение последних изменений из репозитория..."
git pull

# Обновление зависимостей
log "Обновление зависимостей..."
npm ci

# Перезапуск системы
log "Перезапуск системы..."
./scripts/restart-system.sh

log "Обновление системы завершено."
EOF
    
    chmod +x ./scripts/update-system.sh
    
    log "Скрипт для обновления системы создан."
    
    # Создание скрипта для настройки cron-задач
    cat > ./scripts/setup-cron-jobs.sh << 'EOF'
#!/bin/bash

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

# Получение абсолютного пути к директории проекта
PROJECT_DIR=$(pwd)

# Создание временного файла для crontab
TEMP_CRONTAB=$(mktemp)

# Экспорт текущего crontab
crontab -l > $TEMP_CRONTAB 2>/dev/null || echo "" > $TEMP_CRONTAB

# Добавление задачи для проверки состояния системы (каждый час)
echo "0 * * * * cd $PROJECT_DIR && ./scripts/check-system-status.sh >> ./logs/system-status.log 2>&1" >> $TEMP_CRONTAB

# Добавление задачи для создания резервной копии (каждый день в 3:00)
echo "0 3 * * * cd $PROJECT_DIR && ./scripts/backup-system.sh >> ./logs/backup.log 2>&1" >> $TEMP_CRONTAB

# Добавление задачи для обновления системы (каждую неделю в воскресенье в 4:00)
echo "0 4 * * 0 cd $PROJECT_DIR && ./scripts/update-system.sh >> ./logs/update.log 2>&1" >> $TEMP_CRONTAB

# Установка нового crontab
crontab $TEMP_CRONTAB

# Удаление временного файла
rm $TEMP_CRONTAB

log "Cron-задачи настроены."
EOF
    
    chmod +x ./scripts/setup-cron-jobs.sh
    
    log "Скрипт для настройки cron-задач создан."
    
    log "Настройка поддержки системы завершена."
}

# 5.5. Оптимизация после запуска
optimize_system() {
    log "Оптимизация после запуска..."
    
    # Создание скрипта для оптимизации системы
    cat > ./scripts/optimize-system.sh << 'EOF'
#!/bin/bash

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

# Оптимизация базы данных
log "Оптимизация базы данных..."
DB_CONTAINER=$(docker-compose -f docker-compose.production.yml ps -q db)
./scripts/optimization/optimize-db.sh $DB_CONTAINER

# Оптимизация API
log "Оптимизация API..."
API_CONTAINER=$(docker-compose -f docker-compose.production.yml ps -q api)
./scripts/optimization/optimize-api.sh $API_CONTAINER

# Настройка кэширования с использованием Redis
log "Настройка кэширования с использованием Redis..."
./scripts/optimization/setup-redis.sh

log "Оптимизация системы завершена."
EOF
    
    chmod +x ./scripts/optimize-system.sh
    
    log "Скрипт для оптимизации системы создан."
    
    log "Оптимизация после запуска завершена."
}

# Основная функция
main() {
    log "Начало запуска и поддержки VHM24..."
    
    check_dependencies
    check_readiness
    launch_system
    monitor_system
    support_system
    optimize_system
    
    log "Запуск и поддержка VHM24 завершены."
    log "Система успешно запущена и готова к использованию."
    log "Для проверки состояния системы выполните: ./scripts/check-system-status.sh"
    log "Для перезапуска системы выполните: ./scripts/restart-system.sh"
    log "Для создания резервной копии выполните: ./scripts/backup-system.sh"
    log "Для восстановления из резервной копии выполните: ./scripts/restore-system.sh <путь_к_файлу_резервной_копии>"
    log "Для обновления системы выполните: ./scripts/update-system.sh"
    log "Для настройки cron-задач выполните: ./scripts/setup-cron-jobs.sh"
    log "Для оптимизации системы выполните: ./scripts/optimize-system.sh"
}

# Запуск основной функции
main
