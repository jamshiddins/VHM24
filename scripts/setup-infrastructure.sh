#!/bin/bash
# Скрипт для настройки инфраструктуры VHM24
# Этап 1: Подготовка инфраструктуры

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
    
    for cmd in docker docker-compose curl wget openssl jq; do
        if ! command -v $cmd &> /dev/null; then
            error "Утилита $cmd не установлена. Пожалуйста, установите ее и запустите скрипт снова."
        fi
    done
    
    log "Все необходимые утилиты установлены."
}

# 1.1. Настройка серверов
setup_servers() {
    log "Настройка серверов..."
    
    # Создание директорий для данных
    mkdir -p ./data/api
    mkdir -p ./data/db
    mkdir -p ./data/bot
    mkdir -p ./data/nginx
    mkdir -p ./data/redis
    mkdir -p ./logs
    
    # Создание docker-compose.yml для продакшена
    cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  # API и бэкенд
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET}
      - BOT_TOKEN=${BOT_TOKEN}
    volumes:
      - ./data/api:/app/data
      - ./logs/api:/app/logs
    depends_on:
      - db
      - redis
    networks:
      - vhm24-network

  # База данных
  db:
    image: postgres:14-alpine
    restart: always
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - ./data/db:/var/lib/postgresql/data
    networks:
      - vhm24-network

  # Telegram-бот
  bot:
    build:
      context: ./telegram-bot
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - API_URL=http://api:3000
      - BOT_TOKEN=${BOT_TOKEN}
      - WEBHOOK_URL=${WEBHOOK_URL}
    volumes:
      - ./data/bot:/app/data
      - ./logs/bot:/app/logs
    depends_on:
      - api
    networks:
      - vhm24-network

  # Веб-сервер и балансировщик нагрузки
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data/nginx/conf.d:/etc/nginx/conf.d
      - ./data/nginx/ssl:/etc/nginx/ssl
      - ./dashboard:/usr/share/nginx/html
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - api
    networks:
      - vhm24-network

  # Redis для кэширования
  redis:
    image: redis:alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
    networks:
      - vhm24-network

networks:
  vhm24-network:
    driver: bridge
EOF
    
    log "Docker Compose файл для продакшена создан."
    
    # Создание .env файла для продакшена
    cat > .env.production << 'EOF'
# Настройки базы данных
DB_USER=vhm24_user
DB_PASSWORD=strong_password_here
DB_NAME=vhm24_db

# Настройки JWT
JWT_SECRET=your_jwt_secret_here

# Настройки Telegram-бота
BOT_TOKEN=your_bot_token_here
WEBHOOK_URL=https://your-domain.com/bot-webhook

# Настройки сервера
NODE_ENV=production
PORT=3000
EOF
    
    log "Файл .env.production создан. Пожалуйста, замените значения переменных на реальные."
    
    # Создание конфигурации Nginx
    mkdir -p ./data/nginx/conf.d
    
    cat > ./data/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # Редирект на HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Настройки HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Веб-интерфейс
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API
    location /api/ {
        proxy_pass http://api:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Webhook для Telegram-бота
    location /bot-webhook {
        proxy_pass http://bot:3001/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    
    log "Конфигурация Nginx создана. Пожалуйста, замените 'your-domain.com' на реальный домен."
    
    log "Настройка серверов завершена."
}

# 1.2. Настройка базы данных
setup_database() {
    log "Настройка базы данных..."
    
    # Создание скрипта для инициализации базы данных
    mkdir -p ./scripts/db
    
    cat > ./scripts/db/init.sql << 'EOF'
-- Создание таблиц для VHM24

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    telegram_id BIGINT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица автоматов
CREATE TABLE IF NOT EXISTS machines (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_service TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица маршрутов
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    operator_id INTEGER REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица связи маршрутов и автоматов
CREATE TABLE IF NOT EXISTS route_machines (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    machine_id INTEGER REFERENCES machines(id),
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, machine_id)
);

-- Таблица задач
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    assignee_id INTEGER REFERENCES users(id),
    machine_id INTEGER REFERENCES machines(id),
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица чек-листов
CREATE TABLE IF NOT EXISTS checklists (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица комментариев к задачам
CREATE TABLE IF NOT EXISTS task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица продаж
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL UNIQUE,
    machine_id INTEGER REFERENCES machines(id),
    product_id INTEGER REFERENCES products(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица инкассаций
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machines(id),
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ошибок
CREATE TABLE IF NOT EXISTS errors (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    machine_id INTEGER REFERENCES machines(id),
    order_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_sales_machine ON sales(machine_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_collections_machine ON collections(machine_id);
CREATE INDEX IF NOT EXISTS idx_errors_type ON errors(type);
CREATE INDEX IF NOT EXISTS idx_errors_machine ON errors(machine_id);

-- Создание администратора по умолчанию
INSERT INTO users (username, password, email, role, first_name, last_name)
VALUES ('admin', '$2b$10$X7VYVy9H5NvNvUYP8fOzB.Yz9yVHCZUBinX2/JNbGFoQYioLhWFJi', 'admin@vhm24.com', 'ADMIN', 'Admin', 'User')
ON CONFLICT (username) DO NOTHING;
EOF
    
    log "Скрипт инициализации базы данных создан."
    
    # Создание скрипта для резервного копирования базы данных
    cat > ./scripts/db/backup.sh << 'EOF'
#!/bin/bash

# Настройки
BACKUP_DIR="./backups"
DB_CONTAINER="vhm24_db_1"
DB_NAME="vhm24_db"
DB_USER="vhm24_user"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
DAYS_TO_KEEP=30

# Создание директории для резервных копий
mkdir -p $BACKUP_DIR

# Создание резервной копии
echo "Создание резервной копии базы данных..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Сжатие резервной копии
echo "Сжатие резервной копии..."
gzip $BACKUP_FILE

# Удаление старых резервных копий
echo "Удаление резервных копий старше $DAYS_TO_KEEP дней..."
find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +$DAYS_TO_KEEP -delete

echo "Резервное копирование завершено: ${BACKUP_FILE}.gz"
EOF
    
    chmod +x ./scripts/db/backup.sh
    
    log "Скрипт резервного копирования базы данных создан."
    
    # Создание скрипта для восстановления базы данных
    cat > ./scripts/db/restore.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргумента
if [ $# -ne 1 ]; then
    echo "Использование: $0 <путь_к_файлу_резервной_копии>"
    exit 1
fi

BACKUP_FILE=$1
DB_CONTAINER="vhm24_db_1"
DB_NAME="vhm24_db"
DB_USER="vhm24_user"

# Проверка существования файла
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Файл $BACKUP_FILE не существует."
    exit 1
fi

# Распаковка файла, если он сжат
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Распаковка файла..."
    gunzip -c $BACKUP_FILE > ${BACKUP_FILE%.gz}
    BACKUP_FILE=${BACKUP_FILE%.gz}
fi

# Восстановление базы данных
echo "Восстановление базы данных из файла $BACKUP_FILE..."
cat $BACKUP_FILE | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME

echo "Восстановление завершено."
EOF
    
    chmod +x ./scripts/db/restore.sh
    
    log "Скрипт восстановления базы данных создан."
    
    log "Настройка базы данных завершена."
}

# 1.3. Настройка сети
setup_network() {
    log "Настройка сети..."
    
    # Создание директории для SSL-сертификатов
    mkdir -p ./data/nginx/ssl
    
    # Создание скрипта для получения SSL-сертификатов с Let's Encrypt
    cat > ./scripts/ssl/get-certificates.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргумента
if [ $# -ne 1 ]; then
    echo "Использование: $0 <домен>"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@${DOMAIN}"
SSL_DIR="./data/nginx/ssl"

# Установка certbot, если он не установлен
if ! command -v certbot &> /dev/null; then
    echo "Установка certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Получение сертификатов
echo "Получение SSL-сертификатов для домена ${DOMAIN}..."
certbot certonly --standalone --preferred-challenges http -d ${DOMAIN} --email ${EMAIL} --agree-tos --non-interactive

# Копирование сертификатов
echo "Копирование сертификатов..."
cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${SSL_DIR}/
cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ${SSL_DIR}/

echo "SSL-сертификаты получены и скопированы в ${SSL_DIR}."
EOF
    
    chmod +x ./scripts/ssl/get-certificates.sh
    
    log "Скрипт для получения SSL-сертификатов создан."
    
    # Создание скрипта для настройки Cloudflare (опционально)
    cat > ./scripts/cloudflare/setup.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргументов
if [ $# -ne 3 ]; then
    echo "Использование: $0 <домен> <email> <api_key>"
    exit 1
fi

DOMAIN=$1
EMAIL=$2
API_KEY=$3

# Проверка наличия утилиты curl
if ! command -v curl &> /dev/null; then
    echo "Утилита curl не установлена. Пожалуйста, установите ее и запустите скрипт снова."
    exit 1
fi

# Получение Zone ID
echo "Получение Zone ID для домена ${DOMAIN}..."
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}" \
     -H "X-Auth-Email: ${EMAIL}" \
     -H "X-Auth-Key: ${API_KEY}" \
     -H "Content-Type: application/json" | jq -r '.result[0].id')

if [ "$ZONE_ID" == "null" ]; then
    echo "Не удалось получить Zone ID для домена ${DOMAIN}."
    exit 1
fi

echo "Zone ID: ${ZONE_ID}"

# Настройка DNS-записей
echo "Настройка DNS-записей..."

# A-запись для основного домена
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
     -H "X-Auth-Email: ${EMAIL}" \
     -H "X-Auth-Key: ${API_KEY}" \
     -H "Content-Type: application/json" \
     --data '{"type":"A","name":"'${DOMAIN}'","content":"YOUR_SERVER_IP","ttl":1,"proxied":true}'

# CNAME-запись для поддомена www
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
     -H "X-Auth-Email: ${EMAIL}" \
     -H "X-Auth-Key: ${API_KEY}" \
     -H "Content-Type: application/json" \
     --data '{"type":"CNAME","name":"www","content":"'${DOMAIN}'","ttl":1,"proxied":true}'

echo "DNS-записи настроены."

# Настройка правил безопасности
echo "Настройка правил безопасности..."

# Включение HTTPS
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/always_use_https" \
     -H "X-Auth-Email: ${EMAIL}" \
     -H "X-Auth-Key: ${API_KEY}" \
     -H "Content-Type: application/json" \
     --data '{"value":"on"}'

# Включение HSTS
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/security_header" \
     -H "X-Auth-Email: ${EMAIL}" \
     -H "X-Auth-Key: ${API_KEY}" \
     -H "Content-Type: application/json" \
     --data '{"value":{"strict_transport_security":{"enabled":true,"max_age":31536000,"include_subdomains":true,"nosniff":true}}}'

echo "Правила безопасности настроены."

echo "Настройка Cloudflare для домена ${DOMAIN} завершена."
EOF
    
    chmod +x ./scripts/cloudflare/setup.sh
    
    log "Скрипт для настройки Cloudflare создан."
    
    log "Настройка сети завершена."
}

# Основная функция
main() {
    log "Начало настройки инфраструктуры VHM24..."
    
    check_dependencies
    setup_servers
    setup_database
    setup_network
    
    log "Настройка инфраструктуры VHM24 завершена."
    log "Пожалуйста, отредактируйте созданные файлы конфигурации, заменив значения по умолчанию на реальные."
    log "После этого выполните следующие команды для запуска системы:"
    log "1. cp .env.production .env"
    log "2. docker-compose -f docker-compose.production.yml up -d"
}

# Запуск основной функции
main
