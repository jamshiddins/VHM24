@echo off
REM Скрипт для запуска всех этапов подготовки и запуска VHM24

REM Цвета для вывода (в Windows cmd)
set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set NC=[0m

REM Функция для вывода сообщений
echo %GREEN%[INFO]%NC% Начало запуска всех этапов подготовки и запуска VHM24...

REM Функция для запроса подтверждения
:confirm
set /p REPLY=%~1 (y/n): 
if /i "%REPLY%" neq "y" (
    echo %YELLOW%[WARN]%NC% Этап пропущен.
    exit /b 1
)
exit /b 0

REM Проверка наличия необходимых скриптов
echo %GREEN%[INFO]%NC% Проверка наличия необходимых скриптов...

set REQUIRED_SCRIPTS=scripts\setup-infrastructure.bat scripts\setup-monitoring.bat scripts\setup-deployment.bat scripts\setup-launch-preparation.bat scripts\setup-launch.bat

for %%s in (%REQUIRED_SCRIPTS%) do (
    if not exist %%s (
        echo %RED%[ERROR]%NC% Скрипт %%s не найден.
        exit /b 1
    ) else (
        echo %GREEN%[INFO]%NC% Скрипт %%s найден.
    )
)

echo %GREEN%[INFO]%NC% Все необходимые скрипты найдены.

REM Этап 1: Настройка инфраструктуры
echo %GREEN%[INFO]%NC% Этап 1: Настройка инфраструктуры...

call :confirm "Запустить настройку инфраструктуры?"
if %ERRORLEVEL% equ 0 (
    call scripts\setup-infrastructure.bat
    echo %GREEN%[INFO]%NC% Этап 1 завершен.
) else (
    echo %YELLOW%[WARN]%NC% Этап 1 пропущен.
)

REM Этап 2: Настройка мониторинга и логирования
echo %GREEN%[INFO]%NC% Этап 2: Настройка мониторинга и логирования...

call :confirm "Запустить настройку мониторинга и логирования?"
if %ERRORLEVEL% equ 0 (
    call scripts\setup-monitoring.bat
    echo %GREEN%[INFO]%NC% Этап 2 завершен.
) else (
    echo %YELLOW%[WARN]%NC% Этап 2 пропущен.
)

REM Этап 3: Настройка развертывания и тестирования
echo %GREEN%[INFO]%NC% Этап 3: Настройка развертывания и тестирования...

call :confirm "Запустить настройку развертывания и тестирования?"
if %ERRORLEVEL% equ 0 (
    call scripts\setup-deployment.bat
    echo %GREEN%[INFO]%NC% Этап 3 завершен.
) else (
    echo %YELLOW%[WARN]%NC% Этап 3 пропущен.
)

REM Этап 4: Подготовка к запуску
echo %GREEN%[INFO]%NC% Этап 4: Подготовка к запуску...

call :confirm "Запустить подготовку к запуску?"
if %ERRORLEVEL% equ 0 (
    call scripts\setup-launch-preparation.bat
    echo %GREEN%[INFO]%NC% Этап 4 завершен.
) else (
    echo %YELLOW%[WARN]%NC% Этап 4 пропущен.
)

REM Этап 5: Запуск и поддержка
echo %GREEN%[INFO]%NC% Этап 5: Запуск и поддержка...

call :confirm "Запустить запуск и поддержку?"
if %ERRORLEVEL% equ 0 (
    call scripts\setup-launch.bat
    echo %GREEN%[INFO]%NC% Этап 5 завершен.
) else (
    echo %YELLOW%[WARN]%NC% Этап 5 пропущен.
)

REM Импорт начальных данных
echo %GREEN%[INFO]%NC% Импорт начальных данных...

call :confirm "Запустить импорт начальных данных?"
if %ERRORLEVEL% equ 0 (
    REM Получение имени контейнера базы данных
    for /f "tokens=*" %%i in ('docker-compose -f docker-compose.production.yml ps -q db') do set DB_CONTAINER=%%i
    
    if "%DB_CONTAINER%"=="" (
        echo %YELLOW%[WARN]%NC% Контейнер базы данных не найден. Убедитесь, что система запущена.
    ) else (
        call scripts\import-initial-data.bat %DB_CONTAINER%
        echo %GREEN%[INFO]%NC% Импорт начальных данных завершен.
    )
) else (
    echo %YELLOW%[WARN]%NC% Импорт начальных данных пропущен.
)

REM Настройка начальных параметров системы
echo %GREEN%[INFO]%NC% Настройка начальных параметров системы...

call :confirm "Запустить настройку начальных параметров системы?"
if %ERRORLEVEL% equ 0 (
    REM Получение имени контейнера API
    for /f "tokens=*" %%i in ('docker-compose -f docker-compose.production.yml ps -q api') do set API_CONTAINER=%%i
    
    if "%API_CONTAINER%"=="" (
        echo %YELLOW%[WARN]%NC% Контейнер API не найден. Убедитесь, что система запущена.
    ) else (
        call scripts\setup-initial-parameters.bat %API_CONTAINER%
        echo %GREEN%[INFO]%NC% Настройка начальных параметров системы завершена.
    )
) else (
    echo %YELLOW%[WARN]%NC% Настройка начальных параметров системы пропущена.
)

REM Настройка cron-задач
echo %GREEN%[INFO]%NC% Настройка cron-задач...

call :confirm "Запустить настройку cron-задач?"
if %ERRORLEVEL% equ 0 (
    call scripts\setup-cron-jobs.bat
    echo %GREEN%[INFO]%NC% Настройка cron-задач завершена.
) else (
    echo %YELLOW%[WARN]%NC% Настройка cron-задач пропущена.
)

REM Оптимизация системы
echo %GREEN%[INFO]%NC% Оптимизация системы...

call :confirm "Запустить оптимизацию системы?"
if %ERRORLEVEL% equ 0 (
    call scripts\optimize-system.bat
    echo %GREEN%[INFO]%NC% Оптимизация системы завершена.
) else (
    echo %YELLOW%[WARN]%NC% Оптимизация системы пропущена.
)

echo %GREEN%[INFO]%NC% Все этапы подготовки и запуска VHM24 завершены.
echo %GREEN%[INFO]%NC% Система успешно настроена, запущена и готова к использованию.
echo %GREEN%[INFO]%NC% Для проверки состояния системы выполните: scripts\check-system-status.bat

exit /b 0
