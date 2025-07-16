#!/bin/bash

# Скрипт для запуска всех тестов системы VHM24
# Автоматически проверяет все компоненты системы и выводит результаты

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода заголовка
print_header() {
    echo -e "\n${BLUE}=======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=======================================${NC}\n"
}

# Функция для вывода результата
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2 - УСПЕШНО${NC}"
    else
        echo -e "${RED}✗ $2 - ОШИБКА${NC}"
        FAILED=1
    fi
}

# Инициализация переменной для отслеживания ошибок
FAILED=0

# Создаем директорию для отчетов, если она не существует
mkdir -p ./logs/test-reports

# Текущая дата и время для имени файла отчета
TIMESTAMP=$(date +%Y%m%d%H%M%S)
REPORT_FILE="./logs/test-reports/test-report-$TIMESTAMP.json"

# Начало тестирования
print_header "ЗАПУСК КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ СИСТЕМЫ VHM24"
echo -e "Дата и время: $(date)"
echo -e "Отчет будет сохранен в: $REPORT_FILE"

# 1. Проверка синтаксиса JavaScript файлов
print_header "1. ПРОВЕРКА СИНТАКСИСА JAVASCRIPT"
npx eslint --ext .js ./telegram-bot/src ./backend ./dashboard/js > /dev/null 2>&1
print_result $? "Проверка синтаксиса JavaScript"

# 2. Проверка реализации FSM
print_header "2. ПРОВЕРКА РЕАЛИЗАЦИИ FSM"
node ./scripts/check-fsm-implementation.js
print_result $? "Проверка реализации FSM"

# 3. Проверка обработки ошибок
print_header "3. ПРОВЕРКА ОБРАБОТКИ ОШИБОК"
node ./scripts/check-error-handling.js
print_result $? "Проверка обработки ошибок"

# 4. Тестирование API
print_header "4. ТЕСТИРОВАНИЕ API"
node ./scripts/test-api.js
print_result $? "Тестирование API"

# 5. Тестирование Telegram-бота
print_header "5. ТЕСТИРОВАНИЕ TELEGRAM-БОТА"
node ./scripts/test-telegram-bot.js
print_result $? "Тестирование Telegram-бота"

# 6. Тестирование веб-интерфейса
print_header "6. ТЕСТИРОВАНИЕ ВЕБ-ИНТЕРФЕЙСА"
node ./scripts/test-web-interface.js
print_result $? "Тестирование веб-интерфейса"

# 7. Проверка подключения к базе данных
print_header "7. ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ"
node ./scripts/check-database-connections.js
print_result $? "Проверка подключения к базе данных"

# 8. Проверка переменных окружения
print_header "8. ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ"
node ./check-env.js
print_result $? "Проверка переменных окружения"

# 9. Комплексное тестирование системы
print_header "9. КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ"
node ./test-system-comprehensive.js > /dev/null 2>&1
print_result $? "Комплексное тестирование системы"

# Формирование итогового отчета
print_header "ИТОГОВЫЙ ОТЧЕТ"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО${NC}"
    STATUS="SUCCESS"
else
    echo -e "${RED}✗ ОБНАРУЖЕНЫ ОШИБКИ В ТЕСТАХ${NC}"
    echo -e "${YELLOW}Пожалуйста, проверьте логи для получения дополнительной информации.${NC}"
    STATUS="FAILED"
fi

# Создаем JSON отчет
echo "{" > $REPORT_FILE
echo "  \"timestamp\": \"$(date -Iseconds)\"," >> $REPORT_FILE
echo "  \"status\": \"$STATUS\"," >> $REPORT_FILE
echo "  \"tests\": [" >> $REPORT_FILE
echo "    {\"name\": \"Проверка синтаксиса JavaScript\", \"result\": \"$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')\"}," >> $REPORT_FILE
echo "    {\"name\": \"Проверка реализации FSM\", \"result\": \"$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')\"}," >> $REPORT_FILE
echo "    {\"name\": \"Проверка обработки ошибок\", \"result\": \"$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')\"}," >> $REPORT_FILE
echo "    {\"name\": \"Тестирование API\", \"result\": \"$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')\"}," >> $REPORT_FILE
echo "    {\"name\": \"Тестирование Telegram-бота\", \"result\": \"$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')\"}," >> $REPORT_FILE
echo "    {\"name\": \"Тестирование веб-интерфейса\", \"result\": \"$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')\"}," >> $REPORT_FILE
echo "    {\"name\": \"Проверка подключения к базе данных\", \"result\": \"$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')\"}," >> $REPORT_FILE
echo "    {\"name\": \"Проверка переменных окружения\", \"result\": \"$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')\"}," >> $REPORT_FILE
echo "    {\"name\": \"Комплексное тестирование системы\", \"result\": \"$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')\"}" >> $REPORT_FILE
echo "  ]" >> $REPORT_FILE
echo "}" >> $REPORT_FILE

echo -e "\nОтчет сохранен в: $REPORT_FILE"
echo -e "\nТестирование завершено: $(date)"

exit $FAILED
