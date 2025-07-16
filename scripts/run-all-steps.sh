#!/bin/bash
# Скрипт для запуска всех этапов подготовки и запуска VHM24

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

# Функция для запроса подтверждения
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Проверка наличия необходимых скриптов
check_scripts() {
    log "Проверка наличия необходимых скриптов..."
    
    required_scripts=(
        "./scripts/setup-infrastructure.sh"
        "./scripts/setup-monitoring.sh"
        "./scripts/setup-deployment.sh"
        "./scripts/setup-launch-preparation.sh"
        "./scripts/setup-launch.sh"
    )
    
    for script in "${required_scripts[@]}"; do
        if [ ! -f "$script" ]; then
            error "Скрипт $script не найден."
        else
            log "Скрипт $script найден."
            # Проверка прав на выполнение
            if [ ! -x "$script" ]; then
                log "Установка прав на выполнение для скрипта $script..."
                chmod +x "$script"
            fi
        fi
    done
    
    log "Все необходимые скрипты найдены и имеют права на выполнение."
}

# Этап 1: Настройка инфраструктуры
setup_infrastructure() {
    log "Этап 1: Настройка инфраструктуры..."
    
    if confirm "Запустить настройку инфраструктуры?"; then
        ./scripts/setup-infrastructure.sh
        log "Этап 1 завершен."
    else
        warn "Этап 1 пропущен."
    fi
}

# Этап 2: Настройка мониторинга и логирования
setup_monitoring() {
    log "Этап 2: Настройка мониторинга и логирования..."
    
    if confirm "Запустить настройку мониторинга и логирования?"; then
        ./scripts/setup-monitoring.sh
        log "Этап 2 завершен."
    else
        warn "Этап 2 пропущен."
    fi
}

# Этап 3: Настройка развертывания и тестирования
setup_deployment() {
    log "Этап 3: Настройка развертывания и тестирования..."
    
    if confirm "Запустить настройку развертывания и тестирования?"; then
        ./scripts/setup-deployment.sh
        log "Этап 3 завершен."
    else
        warn "Этап 3 пропущен."
    fi
}

# Этап 4: Подготовка к запуску
setup_launch_preparation() {
    log "Этап 4: Подготовка к запуску..."
    
    if confirm "Запустить подготовку к запуску?"; then
        ./scripts/setup-launch-preparation.sh
        log "Этап 4 завершен."
    else
        warn "Этап 4 пропущен."
    fi
}

# Этап 5: Запуск и поддержка
setup_launch() {
    log "Этап 5: Запуск и поддержка..."
    
    if confirm "Запустить запуск и поддержку?"; then
        ./scripts/setup-launch.sh
        log "Этап 5 завершен."
    else
        warn "Этап 5 пропущен."
    fi
}

# Импорт начальных данных
import_initial_data() {
    log "Импорт начальных данных..."
    
    if confirm "Запустить импорт начальных данных?"; then
        # Получение имени контейнера базы данных
        DB_CONTAINER=$(docker-compose -f docker-compose.production.yml ps -q db)
        
        if [ -z "$DB_CONTAINER" ]; then
            warn "Контейнер базы данных не найден. Убедитесь, что система запущена."
            return
        fi
        
        ./scripts/import-initial-data.sh $DB_CONTAINER
        log "Импорт начальных данных завершен."
    else
        warn "Импорт начальных данных пропущен."
    fi
}

# Настройка начальных параметров системы
setup_initial_parameters() {
    log "Настройка начальных параметров системы..."
    
    if confirm "Запустить настройку начальных параметров системы?"; then
        # Получение имени контейнера API
        API_CONTAINER=$(docker-compose -f docker-compose.production.yml ps -q api)
        
        if [ -z "$API_CONTAINER" ]; then
            warn "Контейнер API не найден. Убедитесь, что система запущена."
            return
        fi
        
        ./scripts/setup-initial-parameters.sh $API_CONTAINER
        log "Настройка начальных параметров системы завершена."
    else
        warn "Настройка начальных параметров системы пропущена."
    fi
}

# Настройка cron-задач
setup_cron_jobs() {
    log "Настройка cron-задач..."
    
    if confirm "Запустить настройку cron-задач?"; then
        ./scripts/setup-cron-jobs.sh
        log "Настройка cron-задач завершена."
    else
        warn "Настройка cron-задач пропущена."
    fi
}

# Оптимизация системы
optimize_system() {
    log "Оптимизация системы..."
    
    if confirm "Запустить оптимизацию системы?"; then
        ./scripts/optimize-system.sh
        log "Оптимизация системы завершена."
    else
        warn "Оптимизация системы пропущена."
    fi
}

# Основная функция
main() {
    log "Начало запуска всех этапов подготовки и запуска VHM24..."
    
    check_scripts
    setup_infrastructure
    setup_monitoring
    setup_deployment
    setup_launch_preparation
    setup_launch
    import_initial_data
    setup_initial_parameters
    setup_cron_jobs
    optimize_system
    
    log "Все этапы подготовки и запуска VHM24 завершены."
    log "Система успешно настроена, запущена и готова к использованию."
    log "Для проверки состояния системы выполните: ./scripts/check-system-status.sh"
}

# Запуск основной функции
main
