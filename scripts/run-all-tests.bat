@echo off
setlocal enabledelayedexpansion

:: Скрипт для запуска всех тестов системы VHM24
:: Автоматически проверяет все компоненты системы и выводит результаты

:: Цвета для вывода (если поддерживаются)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

:: Функция для вывода заголовка
:print_header
echo.
echo %BLUE%=======================================%NC%
echo %BLUE%%~1%NC%
echo %BLUE%=======================================%NC%
echo.
goto :eof

:: Инициализация переменной для отслеживания ошибок
set FAILED=0

:: Создаем директорию для отчетов, если она не существует
if not exist ".\logs\test-reports" mkdir ".\logs\test-reports"

:: Текущая дата и время для имени файла отчета
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,14%"
set "REPORT_FILE=.\logs\test-reports\test-report-%TIMESTAMP%.json"

:: Начало тестирования
call :print_header "ЗАПУСК КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ СИСТЕМЫ VHM24"
echo Дата и время: %date% %time%
echo Отчет будет сохранен в: %REPORT_FILE%

:: 1. Проверка синтаксиса JavaScript файлов
call :print_header "1. ПРОВЕРКА СИНТАКСИСА JAVASCRIPT"
npx eslint --ext .js ./telegram-bot/src ./backend ./dashboard/js > nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ Проверка синтаксиса JavaScript - УСПЕШНО%NC%
) else (
    echo %RED%✗ Проверка синтаксиса JavaScript - ОШИБКА%NC%
    set FAILED=1
)

:: 2. Проверка реализации FSM
call :print_header "2. ПРОВЕРКА РЕАЛИЗАЦИИ FSM"
node ./scripts/check-fsm-implementation.js
if %errorlevel% equ 0 (
    echo %GREEN%✓ Проверка реализации FSM - УСПЕШНО%NC%
) else (
    echo %RED%✗ Проверка реализации FSM - ОШИБКА%NC%
    set FAILED=1
)

:: 3. Проверка обработки ошибок
call :print_header "3. ПРОВЕРКА ОБРАБОТКИ ОШИБОК"
node ./scripts/check-error-handling.js
if %errorlevel% equ 0 (
    echo %GREEN%✓ Проверка обработки ошибок - УСПЕШНО%NC%
) else (
    echo %RED%✗ Проверка обработки ошибок - ОШИБКА%NC%
    set FAILED=1
)

:: 4. Тестирование API
call :print_header "4. ТЕСТИРОВАНИЕ API"
node ./scripts/test-api.js
if %errorlevel% equ 0 (
    echo %GREEN%✓ Тестирование API - УСПЕШНО%NC%
) else (
    echo %RED%✗ Тестирование API - ОШИБКА%NC%
    set FAILED=1
)

:: 5. Тестирование Telegram-бота
call :print_header "5. ТЕСТИРОВАНИЕ TELEGRAM-БОТА"
node ./scripts/test-telegram-bot.js
if %errorlevel% equ 0 (
    echo %GREEN%✓ Тестирование Telegram-бота - УСПЕШНО%NC%
) else (
    echo %RED%✗ Тестирование Telegram-бота - ОШИБКА%NC%
    set FAILED=1
)

:: 6. Тестирование веб-интерфейса
call :print_header "6. ТЕСТИРОВАНИЕ ВЕБ-ИНТЕРФЕЙСА"
node ./scripts/test-web-interface.js
if %errorlevel% equ 0 (
    echo %GREEN%✓ Тестирование веб-интерфейса - УСПЕШНО%NC%
) else (
    echo %RED%✗ Тестирование веб-интерфейса - ОШИБКА%NC%
    set FAILED=1
)

:: 7. Проверка подключения к базе данных
call :print_header "7. ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ"
node ./scripts/check-database-connections.js
if %errorlevel% equ 0 (
    echo %GREEN%✓ Проверка подключения к базе данных - УСПЕШНО%NC%
) else (
    echo %RED%✗ Проверка подключения к базе данных - ОШИБКА%NC%
    set FAILED=1
)

:: 8. Проверка переменных окружения
call :print_header "8. ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ"
node ./check-env.js
if %errorlevel% equ 0 (
    echo %GREEN%✓ Проверка переменных окружения - УСПЕШНО%NC%
) else (
    echo %RED%✗ Проверка переменных окружения - ОШИБКА%NC%
    set FAILED=1
)

:: 9. Комплексное тестирование системы
call :print_header "9. КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ"
node ./test-system-comprehensive.js > nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ Комплексное тестирование системы - УСПЕШНО%NC%
) else (
    echo %RED%✗ Комплексное тестирование системы - ОШИБКА%NC%
    set FAILED=1
)

:: Формирование итогового отчета
call :print_header "ИТОГОВЫЙ ОТЧЕТ"

if %FAILED% equ 0 (
    echo %GREEN%✓ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО%NC%
    set "STATUS=SUCCESS"
) else (
    echo %RED%✗ ОБНАРУЖЕНЫ ОШИБКИ В ТЕСТАХ%NC%
    echo %YELLOW%Пожалуйста, проверьте логи для получения дополнительной информации.%NC%
    set "STATUS=FAILED"
)

:: Создаем JSON отчет
echo { > %REPORT_FILE%
echo   "timestamp": "%date% %time%", >> %REPORT_FILE%
echo   "status": "%STATUS%", >> %REPORT_FILE%
echo   "tests": [ >> %REPORT_FILE%
echo     {"name": "Проверка синтаксиса JavaScript", "result": "%STATUS%"}, >> %REPORT_FILE%
echo     {"name": "Проверка реализации FSM", "result": "%STATUS%"}, >> %REPORT_FILE%
echo     {"name": "Проверка обработки ошибок", "result": "%STATUS%"}, >> %REPORT_FILE%
echo     {"name": "Тестирование API", "result": "%STATUS%"}, >> %REPORT_FILE%
echo     {"name": "Тестирование Telegram-бота", "result": "%STATUS%"}, >> %REPORT_FILE%
echo     {"name": "Тестирование веб-интерфейса", "result": "%STATUS%"}, >> %REPORT_FILE%
echo     {"name": "Проверка подключения к базе данных", "result": "%STATUS%"}, >> %REPORT_FILE%
echo     {"name": "Проверка переменных окружения", "result": "%STATUS%"}, >> %REPORT_FILE%
echo     {"name": "Комплексное тестирование системы", "result": "%STATUS%"} >> %REPORT_FILE%
echo   ] >> %REPORT_FILE%
echo } >> %REPORT_FILE%

echo.
echo Отчет сохранен в: %REPORT_FILE%
echo.
echo Тестирование завершено: %date% %time%

exit /b %FAILED%
