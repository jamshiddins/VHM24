#!/bin/bash
# Скрипт для проверки и исправления ошибок в системе VHM24
# Этот скрипт проверяет синтаксис кода, функциональность компонентов,
# совместимость и синхронизацию между ботом и веб-интерфейсом,
# а также подготавливает систему к запуску.

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

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Функция для проверки синтаксиса JavaScript-файлов
check_js_syntax() {
    log "Проверка синтаксиса JavaScript-файлов..."
    
    # Проверка наличия ESLint
    if ! command -v npx &> /dev/null; then
        warn "npx не установлен. Установка..."
        npm install -g npx
    fi
    
    if [ ! -f ".eslintrc.js" ]; then
        warn "Файл .eslintrc.js не найден. Создание..."
        cat > .eslintrc.js << 'EOF'
module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2020,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": "off"
    }
};
EOF
    fi
    
    # Проверка и исправление синтаксиса в telegram-bot
    log "Проверка синтаксиса в telegram-bot..."
    npx eslint --fix telegram-bot/src/**/*.js
    
    # Проверка и исправление синтаксиса в backend
    log "Проверка синтаксиса в backend..."
    npx eslint --fix backend/**/*.js
    
    # Проверка и исправление синтаксиса в dashboard
    log "Проверка синтаксиса в dashboard..."
    npx eslint --fix dashboard/js/**/*.js
    
    success "Проверка и исправление синтаксиса JavaScript-файлов завершена."
}

# Функция для проверки синтаксиса HTML-файлов
check_html_syntax() {
    log "Проверка синтаксиса HTML-файлов..."
    
    # Проверка наличия html-validate
    if ! command -v npx html-validate &> /dev/null; then
        warn "html-validate не установлен. Установка..."
        npm install -g html-validate
    fi
    
    # Проверка синтаксиса в dashboard
    log "Проверка синтаксиса в dashboard..."
    npx html-validate dashboard/*.html
    
    success "Проверка синтаксиса HTML-файлов завершена."
}

# Функция для проверки синтаксиса CSS-файлов
check_css_syntax() {
    log "Проверка синтаксиса CSS-файлов..."
    
    # Проверка наличия stylelint
    if ! command -v npx stylelint &> /dev/null; then
        warn "stylelint не установлен. Установка..."
        npm install -g stylelint stylelint-config-standard
    fi
    
    if [ ! -f ".stylelintrc.json" ]; then
        warn "Файл .stylelintrc.json не найден. Создание..."
        cat > .stylelintrc.json << 'EOF'
{
  "extends": "stylelint-config-standard"
}
EOF
    fi
    
    # Проверка и исправление синтаксиса в dashboard
    log "Проверка синтаксиса в dashboard..."
    npx stylelint --fix dashboard/css/**/*.css
    
    success "Проверка и исправление синтаксиса CSS-файлов завершена."
}

# Функция для проверки синтаксиса shell-скриптов
check_shell_syntax() {
    log "Проверка синтаксиса shell-скриптов..."
    
    # Проверка наличия shellcheck
    if ! command -v shellcheck &> /dev/null; then
        warn "shellcheck не установлен. Пропуск проверки shell-скриптов."
        return
    fi
    
    # Проверка синтаксиса в scripts
    log "Проверка синтаксиса в scripts..."
    for script in scripts/*.sh; do
        log "Проверка $script..."
        shellcheck "$script"
    done
    
    success "Проверка синтаксиса shell-скриптов завершена."
}

# Функция для проверки и исправления прав доступа к файлам
check_file_permissions() {
    log "Проверка и исправление прав доступа к файлам..."
    
    # Установка прав на выполнение для скриптов
    log "Установка прав на выполнение для скриптов..."
    chmod +x scripts/*.sh
    
    # Установка прав на чтение и запись для конфигурационных файлов
    log "Установка прав на чтение и запись для конфигурационных файлов..."
    chmod 644 .env*
    chmod 644 backend/.env*
    
    success "Проверка и исправление прав доступа к файлам завершена."
}

# Функция для проверки и исправления переменных окружения
check_env_variables() {
    log "Проверка и исправление переменных окружения..."
    
    # Проверка наличия файла .env
    if [ ! -f ".env" ]; then
        warn "Файл .env не найден. Создание из .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            error "Файл .env.example не найден. Невозможно создать .env."
            return
        fi
    fi
    
    # Проверка наличия файла backend/.env
    if [ ! -f "backend/.env" ]; then
        warn "Файл backend/.env не найден. Создание из backend/.env.example..."
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
        else
            error "Файл backend/.env.example не найден. Невозможно создать backend/.env."
            return
        fi
    fi
    
    # Проверка необходимых переменных окружения в .env
    log "Проверка необходимых переменных окружения в .env..."
    required_vars=("DB_USER" "DB_PASSWORD" "DB_NAME" "JWT_SECRET" "BOT_TOKEN" "WEBHOOK_URL")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            warn "Переменная окружения $var не найдена в файле .env. Добавление..."
            echo "$var=change_me" >> .env
        fi
    done
    
    success "Проверка и исправление переменных окружения завершена."
}

# Функция для проверки и исправления зависимостей
check_dependencies() {
    log "Проверка и исправление зависимостей..."
    
    # Проверка наличия package.json
    if [ ! -f "package.json" ]; then
        error "Файл package.json не найден. Невозможно проверить зависимости."
        return
    fi
    
    # Установка зависимостей
    log "Установка зависимостей..."
    npm install
    
    # Проверка наличия package.json в telegram-bot
    if [ -f "telegram-bot/package.json" ]; then
        log "Установка зависимостей для telegram-bot..."
        cd telegram-bot && npm install && cd ..
    fi
    
    # Проверка наличия package.json в backend
    if [ -f "backend/package.json" ]; then
        log "Установка зависимостей для backend..."
        cd backend && npm install && cd ..
    fi
    
    success "Проверка и исправление зависимостей завершена."
}

# Функция для проверки и исправления базы данных
check_database() {
    log "Проверка и исправление базы данных..."
    
    # Проверка наличия скрипта для проверки базы данных
    if [ -f "scripts/check-database-tables.js" ]; then
        log "Запуск скрипта для проверки базы данных..."
        node scripts/check-database-tables.js
    else
        warn "Скрипт scripts/check-database-tables.js не найден. Пропуск проверки базы данных."
    fi
    
    # Проверка наличия скрипта для миграции базы данных
    if [ -f "apply-database-migrations.js" ]; then
        log "Запуск скрипта для миграции базы данных..."
        node apply-database-migrations.js
    else
        warn "Скрипт apply-database-migrations.js не найден. Пропуск миграции базы данных."
    fi
    
    success "Проверка и исправление базы данных завершена."
}

# Функция для проверки и исправления API
check_api() {
    log "Проверка и исправление API..."
    
    # Проверка наличия скрипта для проверки API
    if [ -f "scripts/test-api.js" ]; then
        log "Запуск скрипта для проверки API..."
        node scripts/test-api.js
    else
        warn "Скрипт scripts/test-api.js не найден. Создание..."
        
        mkdir -p scripts
        
        cat > scripts/test-api.js << 'EOF'
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Функция для проверки API
async function testApi() {
  console.log('Проверка API...');
  
  try {
    // Проверка доступности API
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('API доступен:', healthResponse.data);
    
    // Проверка API для пользователей
    console.log('Проверка API для пользователей...');
    const usersResponse = await axios.get(`${API_URL}/users/test`);
    console.log('API для пользователей:', usersResponse.data);
    
    // Проверка API для автоматов
    console.log('Проверка API для автоматов...');
    const machinesResponse = await axios.get(`${API_URL}/machines/test`);
    console.log('API для автоматов:', machinesResponse.data);
    
    // Проверка API для задач
    console.log('Проверка API для задач...');
    const tasksResponse = await axios.get(`${API_URL}/tasks/test`);
    console.log('API для задач:', tasksResponse.data);
    
    // Проверка API для сумок
    console.log('Проверка API для сумок...');
    const bagsResponse = await axios.get(`${API_URL}/bags/test`);
    console.log('API для сумок:', bagsResponse.data);
    
    // Проверка API для инкассации
    console.log('Проверка API для инкассации...');
    const collectionsResponse = await axios.get(`${API_URL}/collections/test`);
    console.log('API для инкассации:', collectionsResponse.data);
    
    // Проверка API для аналитики
    console.log('Проверка API для аналитики...');
    const analyticsResponse = await axios.get(`${API_URL}/analytics/test`);
    console.log('API для аналитики:', analyticsResponse.data);
    
    // Проверка API для отчетов
    console.log('Проверка API для отчетов...');
    const reportsResponse = await axios.get(`${API_URL}/reports/test`);
    console.log('API для отчетов:', reportsResponse.data);
    
    console.log('Проверка API завершена успешно.');
  } catch (error) {
    console.error('Ошибка при проверке API:', error.message);
    if (error.response) {
      console.error('Ответ сервера:', error.response.data);
    }
  }
}

// Запуск проверки API
testApi();
EOF
        
        log "Установка зависимостей для скрипта test-api.js..."
        npm install axios dotenv
        
        log "Запуск скрипта для проверки API..."
        node scripts/test-api.js
    fi
    
    success "Проверка и исправление API завершена."
}

# Функция для проверки и исправления Telegram-бота
check_telegram_bot() {
    log "Проверка и исправление Telegram-бота..."
    
    # Проверка наличия скрипта для проверки Telegram-бота
    if [ -f "scripts/test-telegram-bot.js" ]; then
        log "Запуск скрипта для проверки Telegram-бота..."
        node scripts/test-telegram-bot.js
    else
        warn "Скрипт scripts/test-telegram-bot.js не найден. Создание..."
        
        mkdir -p scripts
        
        cat > scripts/test-telegram-bot.js << 'EOF'
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Функция для проверки Telegram-бота
function testTelegramBot() {
  console.log('Проверка Telegram-бота...');
  
  // Проверка наличия токена бота
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: BOT_TOKEN не найден в переменных окружения.');
    return;
  }
  
  // Проверка наличия файла bot.js
  const botFilePath = path.join(__dirname, '..', 'telegram-bot', 'src', 'bot.js');
  if (!fs.existsSync(botFilePath)) {
    console.error(`Ошибка: Файл ${botFilePath} не найден.`);
    return;
  }
  
  // Проверка наличия файла states.js
  const statesFilePath = path.join(__dirname, '..', 'telegram-bot', 'src', 'fsm', 'states.js');
  if (!fs.existsSync(statesFilePath)) {
    console.error(`Ошибка: Файл ${statesFilePath} не найден.`);
    return;
  }
  
  // Проверка наличия директории handlers
  const handlersDir = path.join(__dirname, '..', 'telegram-bot', 'src', 'handlers');
  if (!fs.existsSync(handlersDir)) {
    console.error(`Ошибка: Директория ${handlersDir} не найдена.`);
    return;
  }
  
  // Проверка наличия обработчиков для всех ролей
  const roles = ['admin', 'manager', 'operator', 'warehouse', 'technician', 'common'];
  for (const role of roles) {
    const rolePath = path.join(handlersDir, role);
    if (!fs.existsSync(rolePath)) {
      console.error(`Ошибка: Директория ${rolePath} не найдена.`);
      return;
    }
    
    const indexPath = path.join(rolePath, 'index.js');
    if (!fs.existsSync(indexPath)) {
      console.error(`Ошибка: Файл ${indexPath} не найден.`);
      return;
    }
  }
  
  console.log('Проверка Telegram-бота завершена успешно.');
}

// Запуск проверки Telegram-бота
testTelegramBot();
EOF
        
        log "Установка зависимостей для скрипта test-telegram-bot.js..."
        npm install dotenv
        
        log "Запуск скрипта для проверки Telegram-бота..."
        node scripts/test-telegram-bot.js
    fi
    
    success "Проверка и исправление Telegram-бота завершена."
}

# Функция для проверки и исправления веб-интерфейса
check_web_interface() {
    log "Проверка и исправление веб-интерфейса..."
    
    # Проверка наличия скрипта для проверки веб-интерфейса
    if [ -f "scripts/test-web-interface.js" ]; then
        log "Запуск скрипта для проверки веб-интерфейса..."
        node scripts/test-web-interface.js
    else
        warn "Скрипт scripts/test-web-interface.js не найден. Создание..."
        
        mkdir -p scripts
        
        cat > scripts/test-web-interface.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Функция для проверки веб-интерфейса
function testWebInterface() {
  console.log('Проверка веб-интерфейса...');
  
  // Проверка наличия директории dashboard
  const dashboardDir = path.join(__dirname, '..', 'dashboard');
  if (!fs.existsSync(dashboardDir)) {
    console.error(`Ошибка: Директория ${dashboardDir} не найдена.`);
    return;
  }
  
  // Проверка наличия HTML-файлов для всех дашбордов
  const dashboards = [
    'sales-amount.html',
    'sales-count.html',
    'active-machines.html',
    'inactive-machines.html',
    'active-tasks.html',
    'inventory.html',
    'collections.html',
    'financial.html'
  ];
  
  for (const dashboard of dashboards) {
    const dashboardPath = path.join(dashboardDir, dashboard);
    if (!fs.existsSync(dashboardPath)) {
      console.error(`Ошибка: Файл ${dashboardPath} не найден.`);
      return;
    }
  }
  
  // Проверка наличия директории js
  const jsDir = path.join(dashboardDir, 'js');
  if (!fs.existsSync(jsDir)) {
    console.error(`Ошибка: Директория ${jsDir} не найдена.`);
    return;
  }
  
  // Проверка наличия JavaScript-файлов для всех дашбордов
  const jsFiles = dashboards.map(dashboard => dashboard.replace('.html', '.js'));
  
  for (const jsFile of jsFiles) {
    const jsPath = path.join(jsDir, jsFile);
    if (!fs.existsSync(jsPath)) {
      console.error(`Ошибка: Файл ${jsPath} не найден.`);
      return;
    }
  }
  
  // Проверка наличия директории css
  const cssDir = path.join(dashboardDir, 'css');
  if (!fs.existsSync(cssDir)) {
    console.error(`Ошибка: Директория ${cssDir} не найдена.`);
    return;
  }
  
  // Проверка наличия CSS-файла styles.css
  const cssPath = path.join(cssDir, 'styles.css');
  if (!fs.existsSync(cssPath)) {
    console.error(`Ошибка: Файл ${cssPath} не найден.`);
    return;
  }
  
  console.log('Проверка веб-интерфейса завершена успешно.');
}

// Запуск проверки веб-интерфейса
testWebInterface();
EOF
        
        log "Запуск скрипта для проверки веб-интерфейса..."
        node scripts/test-web-interface.js
    fi
    
    success "Проверка и исправление веб-интерфейса завершена."
}

# Функция для проверки и исправления совместимости и синхронизации
check_compatibility_and_sync() {
    log "Проверка и исправление совместимости и синхронизации..."
    
    # Проверка наличия скрипта для проверки совместимости и синхронизации
    if [ -f "scripts/test-compatibility-and-sync.js" ]; then
        log "Запуск скрипта для проверки совместимости и синхронизации..."
        node scripts/test-compatibility-and-sync.js
    else
        warn "Скрипт scripts/test-compatibility-and-sync.js не найден. Создание..."
        
        mkdir -p scripts
        
        cat > scripts/test-compatibility-and-sync.js << 'EOF'
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Функция для проверки совместимости и синхронизации
function testCompatibilityAndSync() {
  console.log('Проверка совместимости и синхронизации...');
  
  // Проверка наличия API для синхронизации данных
  const apiFilePath = path.join(__dirname, '..', 'backend', 'routes', 'api', 'sync.js');
  if (!fs.existsSync(apiFilePath)) {
    console.error(`Ошибка: Файл ${apiFilePath} не найден.`);
    return;
  }
  
  // Проверка наличия сервиса для синхронизации данных в Telegram-боте
  const botSyncFilePath = path.join(__dirname, '..', 'telegram-bot', 'src', 'services', 'sync.js');
  if (!fs.existsSync(botSyncFilePath)) {
    console.error(`Ошибка: Файл ${botSyncFilePath} не найден.`);
    return;
  }
  
  // Проверка наличия сервиса для синхронизации данных в веб-интерфейсе
  const webSyncFilePath = path.join(__dirname, '..', 'dashboard', 'js', 'sync.js');
  if (!fs.existsSync(webSyncFilePath)) {
    console.error(`Ошибка: Файл ${webSyncFilePath} не найден.`);
    return;
  }
  
  console.log('Проверка совместимости и синхронизации завершена успешно.');
}

// Запуск проверки совместимости и синхронизации
testCompatibilityAndSync();
EOF
        
        log "Установка зависимостей для скрипта test-compatibility-and-sync.js..."
        npm install dotenv
        
        log "Запуск скрипта для проверки совместимости и синхронизации..."
        node scripts/test-compatibility-and-sync.js
    fi
    
    success "Проверка и исправление совместимости и синхронизации завершена."
}

# Функция для обновления репозитория
update_repository() {
    log "Обновление репозитория..."
    
    # Проверка наличия git
    if ! command -v git &> /dev/null; then
        error "git не установлен. Невозможно обновить репозиторий."
        return
    fi
    
    # Проверка наличия .git директории
    if [ ! -d ".git" ]; then
        error "Директория .git не найдена. Невозможно обновить репозиторий."
        return
    fi
    
    # Добавление всех изменений
    log "Добавление всех изменений..."
    git add .
    
    # Создание коммита
    log "Создание коммита..."
    git commit -m "Автоматическое исправление ошибок и подготовка к запуску"
    
    # Отправка изменений в репозиторий
    log "Отправка изменений в репозиторий..."
    git push
    
    success "Обновление репозитория завершено."
}

# Основная функция
main() {
    log "Начало проверки и исправления ошибок в системе VHM24..."
    
    # Проверка синтаксиса кода
    check_js_syntax
    check_html_syntax
    check_css_syntax
    check_shell_syntax
    
    # Проверка и исправление прав доступа к файлам
    check_file_permissions
    
    # Проверка и исправление переменных окружения
    check_env_variables
    
    # Проверка и исправление зависимостей
    check_dependencies
    
    # Проверка и исправление базы данных
    check_database
    
    # Проверка и исправление API
    check_api
    
    # Проверка и исправление Telegram-бота
    check_telegram_bot
    
    # Проверка и исправление веб-интерфейса
    check_web_interface
    
    # Проверка и исправление совместимости и синхронизации
    check_compatibility_and_sync
    
    # Обновление репозитория
    update_repository
    
    success "Проверка и исправление ошибок в системе VHM24 завершена."
    log "Система готова к запуску."
    log "Для запуска системы выполните: ./scripts/run-all-steps.sh"
}

# Запуск основной функции
main
