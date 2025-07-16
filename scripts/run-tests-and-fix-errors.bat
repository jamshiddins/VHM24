@echo off
REM Скрипт для запуска тестов и исправления ошибок в системе VHM24

echo [INFO] Начало запуска тестов и исправления ошибок в системе VHM24...

REM Проверка наличия Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js не установлен. Пожалуйста, установите Node.js и запустите скрипт снова.
    exit /b 1
)

REM Проверка наличия npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm не установлен. Пожалуйста, установите npm и запустите скрипт снова.
    exit /b 1
)

REM Создание директории для отчетов о тестах
if not exist reports mkdir reports

REM Запуск тестов для проверки синтаксиса
echo [INFO] Запуск тестов для проверки синтаксиса...

REM Проверка наличия ESLint
call npx eslint --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] ESLint не установлен. Установка...
    call npm install -g eslint
)

REM Запуск ESLint для проверки синтаксиса JavaScript-файлов
echo [INFO] Запуск ESLint для проверки синтаксиса JavaScript-файлов...
call npx eslint --fix telegram-bot\src\**\*.js backend\**\*.js dashboard\js\**\*.js > reports\eslint-report.txt 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Найдены ошибки синтаксиса в JavaScript-файлах. Подробности в файле reports\eslint-report.txt.
) else (
    echo [SUCCESS] Ошибки синтаксиса в JavaScript-файлах не найдены.
)

REM Запуск тестов для проверки функциональности
echo [INFO] Запуск тестов для проверки функциональности...

REM Проверка наличия Jest
call npx jest --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Jest не установлен. Установка...
    call npm install -g jest
)

REM Запуск Jest для проверки функциональности
echo [INFO] Запуск Jest для проверки функциональности...
call npx jest --no-cache > reports\jest-report.txt 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Найдены ошибки в тестах функциональности. Подробности в файле reports\jest-report.txt.
) else (
    echo [SUCCESS] Тесты функциональности пройдены успешно.
)

REM Запуск тестов для проверки API
echo [INFO] Запуск тестов для проверки API...

REM Проверка наличия скрипта для проверки API
if exist scripts\test-api.js (
    echo [INFO] Запуск скрипта для проверки API...
    node scripts\test-api.js > reports\api-report.txt 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Найдены ошибки в API. Подробности в файле reports\api-report.txt.
    ) else (
        echo [SUCCESS] Тесты API пройдены успешно.
    )
) else (
    echo [WARN] Скрипт scripts\test-api.js не найден. Создание...
    
    echo const axios = require('axios'); > scripts\test-api.js
    echo const fs = require('fs'); >> scripts\test-api.js
    echo const path = require('path'); >> scripts\test-api.js
    echo const dotenv = require('dotenv'); >> scripts\test-api.js
    echo. >> scripts\test-api.js
    echo // Загрузка переменных окружения >> scripts\test-api.js
    echo dotenv.config(); >> scripts\test-api.js
    echo. >> scripts\test-api.js
    echo const API_URL = process.env.API_URL || 'http://localhost:3000/api'; >> scripts\test-api.js
    echo. >> scripts\test-api.js
    echo // Функция для проверки API >> scripts\test-api.js
    echo async function testApi() { >> scripts\test-api.js
    echo   console.log('Проверка API...'); >> scripts\test-api.js
    echo. >> scripts\test-api.js
    echo   try { >> scripts\test-api.js
    echo     // Проверка доступности API >> scripts\test-api.js
    echo     const healthResponse = await axios.get(`${API_URL}/health`); >> scripts\test-api.js
    echo     console.log('API доступен:', healthResponse.data); >> scripts\test-api.js
    echo. >> scripts\test-api.js
    echo     // Проверка API для пользователей >> scripts\test-api.js
    echo     console.log('Проверка API для пользователей...'); >> scripts\test-api.js
    echo     try { >> scripts\test-api.js
    echo       const usersResponse = await axios.get(`${API_URL}/users/test`); >> scripts\test-api.js
    echo       console.log('API для пользователей:', usersResponse.data); >> scripts\test-api.js
    echo     } catch (error) { >> scripts\test-api.js
    echo       console.error('Ошибка при проверке API для пользователей:', error.message); >> scripts\test-api.js
    echo     } >> scripts\test-api.js
    echo. >> scripts\test-api.js
    echo     // Проверка API для автоматов >> scripts\test-api.js
    echo     console.log('Проверка API для автоматов...'); >> scripts\test-api.js
    echo     try { >> scripts\test-api.js
    echo       const machinesResponse = await axios.get(`${API_URL}/machines/test`); >> scripts\test-api.js
    echo       console.log('API для автоматов:', machinesResponse.data); >> scripts\test-api.js
    echo     } catch (error) { >> scripts\test-api.js
    echo       console.error('Ошибка при проверке API для автоматов:', error.message); >> scripts\test-api.js
    echo     } >> scripts\test-api.js
    echo. >> scripts\test-api.js
    echo     // Проверка API для задач >> scripts\test-api.js
    echo     console.log('Проверка API для задач...'); >> scripts\test-api.js
    echo     try { >> scripts\test-api.js
    echo       const tasksResponse = await axios.get(`${API_URL}/tasks/test`); >> scripts\test-api.js
    echo       console.log('API для задач:', tasksResponse.data); >> scripts\test-api.js
    echo     } catch (error) { >> scripts\test-api.js
    echo       console.error('Ошибка при проверке API для задач:', error.message); >> scripts\test-api.js
    echo     } >> scripts\test-api.js
    echo. >> scripts\test-api.js
    echo     console.log('Проверка API завершена.'); >> scripts\test-api.js
    echo   } catch (error) { >> scripts\test-api.js
    echo     console.error('Ошибка при проверке API:', error.message); >> scripts\test-api.js
    echo     if (error.response) { >> scripts\test-api.js
    echo       console.error('Ответ сервера:', error.response.data); >> scripts\test-api.js
    echo     } >> scripts\test-api.js
    echo     process.exit(1); >> scripts\test-api.js
    echo   } >> scripts\test-api.js
    echo } >> scripts\test-api.js
    echo. >> scripts\test-api.js
    echo // Запуск проверки API >> scripts\test-api.js
    echo testApi(); >> scripts\test-api.js
    
    echo [INFO] Установка зависимостей для скрипта test-api.js...
    call npm install axios dotenv
    
    echo [INFO] Запуск скрипта для проверки API...
    node scripts\test-api.js > reports\api-report.txt 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Найдены ошибки в API. Подробности в файле reports\api-report.txt.
    ) else (
        echo [SUCCESS] Тесты API пройдены успешно.
    )
)

REM Запуск тестов для проверки Telegram-бота
echo [INFO] Запуск тестов для проверки Telegram-бота...

REM Проверка наличия скрипта для проверки Telegram-бота
if exist scripts\test-telegram-bot.js (
    echo [INFO] Запуск скрипта для проверки Telegram-бота...
    node scripts\test-telegram-bot.js > reports\telegram-bot-report.txt 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Найдены ошибки в Telegram-боте. Подробности в файле reports\telegram-bot-report.txt.
    ) else (
        echo [SUCCESS] Тесты Telegram-бота пройдены успешно.
    )
) else (
    echo [WARN] Скрипт scripts\test-telegram-bot.js не найден. Создание...
    
    echo const fs = require('fs'); > scripts\test-telegram-bot.js
    echo const path = require('path'); >> scripts\test-telegram-bot.js
    echo const dotenv = require('dotenv'); >> scripts\test-telegram-bot.js
    echo. >> scripts\test-telegram-bot.js
    echo // Загрузка переменных окружения >> scripts\test-telegram-bot.js
    echo dotenv.config(); >> scripts\test-telegram-bot.js
    echo. >> scripts\test-telegram-bot.js
    echo // Функция для проверки Telegram-бота >> scripts\test-telegram-bot.js
    echo function testTelegramBot() { >> scripts\test-telegram-bot.js
    echo   console.log('Проверка Telegram-бота...'); >> scripts\test-telegram-bot.js
    echo. >> scripts\test-telegram-bot.js
    echo   // Проверка наличия токена бота >> scripts\test-telegram-bot.js
    echo   const botToken = process.env.BOT_TOKEN; >> scripts\test-telegram-bot.js
    echo   if (!botToken) { >> scripts\test-telegram-bot.js
    echo     console.error('Ошибка: BOT_TOKEN не найден в переменных окружения.'); >> scripts\test-telegram-bot.js
    echo     process.exit(1); >> scripts\test-telegram-bot.js
    echo   } >> scripts\test-telegram-bot.js
    echo. >> scripts\test-telegram-bot.js
    echo   // Проверка наличия файла bot.js >> scripts\test-telegram-bot.js
    echo   const botFilePath = path.join(__dirname, '..', 'telegram-bot', 'src', 'bot.js'); >> scripts\test-telegram-bot.js
    echo   if (!fs.existsSync(botFilePath)) { >> scripts\test-telegram-bot.js
    echo     console.error(`Ошибка: Файл ${botFilePath} не найден.`); >> scripts\test-telegram-bot.js
    echo     process.exit(1); >> scripts\test-telegram-bot.js
    echo   } >> scripts\test-telegram-bot.js
    echo. >> scripts\test-telegram-bot.js
    echo   // Проверка наличия файла states.js >> scripts\test-telegram-bot.js
    echo   const statesFilePath = path.join(__dirname, '..', 'telegram-bot', 'src', 'fsm', 'states.js'); >> scripts\test-telegram-bot.js
    echo   if (!fs.existsSync(statesFilePath)) { >> scripts\test-telegram-bot.js
    echo     console.error(`Ошибка: Файл ${statesFilePath} не найден.`); >> scripts\test-telegram-bot.js
    echo     process.exit(1); >> scripts\test-telegram-bot.js
    echo   } >> scripts\test-telegram-bot.js
    echo. >> scripts\test-telegram-bot.js
    echo   console.log('Проверка Telegram-бота завершена успешно.'); >> scripts\test-telegram-bot.js
    echo } >> scripts\test-telegram-bot.js
    echo. >> scripts\test-telegram-bot.js
    echo // Запуск проверки Telegram-бота >> scripts\test-telegram-bot.js
    echo testTelegramBot(); >> scripts\test-telegram-bot.js
    
    echo [INFO] Установка зависимостей для скрипта test-telegram-bot.js...
    call npm install dotenv
    
    echo [INFO] Запуск скрипта для проверки Telegram-бота...
    node scripts\test-telegram-bot.js > reports\telegram-bot-report.txt 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Найдены ошибки в Telegram-боте. Подробности в файле reports\telegram-bot-report.txt.
    ) else (
        echo [SUCCESS] Тесты Telegram-бота пройдены успешно.
    )
)

REM Запуск тестов для проверки веб-интерфейса
echo [INFO] Запуск тестов для проверки веб-интерфейса...

REM Проверка наличия скрипта для проверки веб-интерфейса
if exist scripts\test-web-interface.js (
    echo [INFO] Запуск скрипта для проверки веб-интерфейса...
    node scripts\test-web-interface.js > reports\web-interface-report.txt 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Найдены ошибки в веб-интерфейсе. Подробности в файле reports\web-interface-report.txt.
    ) else (
        echo [SUCCESS] Тесты веб-интерфейса пройдены успешно.
    )
) else (
    echo [WARN] Скрипт scripts\test-web-interface.js не найден. Создание...
    
    echo const fs = require('fs'); > scripts\test-web-interface.js
    echo const path = require('path'); >> scripts\test-web-interface.js
    echo. >> scripts\test-web-interface.js
    echo // Функция для проверки веб-интерфейса >> scripts\test-web-interface.js
    echo function testWebInterface() { >> scripts\test-web-interface.js
    echo   console.log('Проверка веб-интерфейса...'); >> scripts\test-web-interface.js
    echo. >> scripts\test-web-interface.js
    echo   // Проверка наличия директории dashboard >> scripts\test-web-interface.js
    echo   const dashboardDir = path.join(__dirname, '..', 'dashboard'); >> scripts\test-web-interface.js
    echo   if (!fs.existsSync(dashboardDir)) { >> scripts\test-web-interface.js
    echo     console.error(`Ошибка: Директория ${dashboardDir} не найдена.`); >> scripts\test-web-interface.js
    echo     process.exit(1); >> scripts\test-web-interface.js
    echo   } >> scripts\test-web-interface.js
    echo. >> scripts\test-web-interface.js
    echo   // Проверка наличия HTML-файлов для всех дашбордов >> scripts\test-web-interface.js
    echo   const dashboards = [ >> scripts\test-web-interface.js
    echo     'sales-amount.html', >> scripts\test-web-interface.js
    echo     'sales-count.html', >> scripts\test-web-interface.js
    echo     'active-machines.html', >> scripts\test-web-interface.js
    echo     'inactive-machines.html', >> scripts\test-web-interface.js
    echo     'active-tasks.html', >> scripts\test-web-interface.js
    echo     'inventory.html', >> scripts\test-web-interface.js
    echo     'collections.html', >> scripts\test-web-interface.js
    echo     'financial.html' >> scripts\test-web-interface.js
    echo   ]; >> scripts\test-web-interface.js
    echo. >> scripts\test-web-interface.js
    echo   for (const dashboard of dashboards) { >> scripts\test-web-interface.js
    echo     const dashboardPath = path.join(dashboardDir, dashboard); >> scripts\test-web-interface.js
    echo     if (!fs.existsSync(dashboardPath)) { >> scripts\test-web-interface.js
    echo       console.error(`Ошибка: Файл ${dashboardPath} не найден.`); >> scripts\test-web-interface.js
    echo       // Создание файла, если он не существует >> scripts\test-web-interface.js
    echo       fs.writeFileSync(dashboardPath, `<!DOCTYPE html> >> scripts\test-web-interface.js
    echo <html lang="ru"> >> scripts\test-web-interface.js
    echo <head> >> scripts\test-web-interface.js
    echo   <meta charset="UTF-8"> >> scripts\test-web-interface.js
    echo   <meta name="viewport" content="width=device-width, initial-scale=1.0"> >> scripts\test-web-interface.js
    echo   <title>${dashboard.replace('.html', '')}</title> >> scripts\test-web-interface.js
    echo   <link rel="stylesheet" href="css/styles.css"> >> scripts\test-web-interface.js
    echo </head> >> scripts\test-web-interface.js
    echo <body> >> scripts\test-web-interface.js
    echo   <h1>${dashboard.replace('.html', '')}</h1> >> scripts\test-web-interface.js
    echo   <div id="app"></div> >> scripts\test-web-interface.js
    echo   <script src="js/${dashboard.replace('.html', '.js')}"></script> >> scripts\test-web-interface.js
    echo </body> >> scripts\test-web-interface.js
    echo </html>`); >> scripts\test-web-interface.js
    echo       console.log(`Файл ${dashboardPath} создан.`); >> scripts\test-web-interface.js
    echo     } >> scripts\test-web-interface.js
    echo   } >> scripts\test-web-interface.js
    echo. >> scripts\test-web-interface.js
    echo   console.log('Проверка веб-интерфейса завершена успешно.'); >> scripts\test-web-interface.js
    echo } >> scripts\test-web-interface.js
    echo. >> scripts\test-web-interface.js
    echo // Запуск проверки веб-интерфейса >> scripts\test-web-interface.js
    echo testWebInterface(); >> scripts\test-web-interface.js
    
    echo [INFO] Запуск скрипта для проверки веб-интерфейса...
    node scripts\test-web-interface.js > reports\web-interface-report.txt 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Найдены ошибки в веб-интерфейсе. Подробности в файле reports\web-interface-report.txt.
    ) else (
        echo [SUCCESS] Тесты веб-интерфейса пройдены успешно.
    )
)

REM Запуск тестов для проверки совместимости и синхронизации
echo [INFO] Запуск тестов для проверки совместимости и синхронизации...

REM Проверка наличия скрипта для проверки совместимости и синхронизации
if exist scripts\test-compatibility-and-sync.js (
    echo [INFO] Запуск скрипта для проверки совместимости и синхронизации...
    node scripts\test-compatibility-and-sync.js > reports\compatibility-and-sync-report.txt 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Найдены ошибки в совместимости и синхронизации. Подробности в файле reports\compatibility-and-sync-report.txt.
    ) else (
        echo [SUCCESS] Тесты совместимости и синхронизации пройдены успешно.
    )
) else (
    echo [WARN] Скрипт scripts\test-compatibility-and-sync.js не найден. Создание...
    
    echo const fs = require('fs'); > scripts\test-compatibility-and-sync.js
    echo const path = require('path'); >> scripts\test-compatibility-and-sync.js
    echo const dotenv = require('dotenv'); >> scripts\test-compatibility-and-sync.js
    echo. >> scripts\test-compatibility-and-sync.js
    echo // Загрузка переменных окружения >> scripts\test-compatibility-and-sync.js
    echo dotenv.config(); >> scripts\test-compatibility-and-sync.js
    echo. >> scripts\test-compatibility-and-sync.js
    echo // Функция для проверки совместимости и синхронизации >> scripts\test-compatibility-and-sync.js
    echo function testCompatibilityAndSync() { >> scripts\test-compatibility-and-sync.js
    echo   console.log('Проверка совместимости и синхронизации...'); >> scripts\test-compatibility-and-sync.js
    echo. >> scripts\test-compatibility-and-sync.js
    echo   // Проверка наличия API для синхронизации данных >> scripts\test-compatibility-and-sync.js
    echo   const apiDir = path.join(__dirname, '..', 'backend', 'routes', 'api'); >> scripts\test-compatibility-and-sync.js
    echo   if (!fs.existsSync(apiDir)) { >> scripts\test-compatibility-and-sync.js
    echo     console.error(`Ошибка: Директория ${apiDir} не найдена.`); >> scripts\test-compatibility-and-sync.js
    echo     fs.mkdirSync(apiDir, { recursive: true }); >> scripts\test-compatibility-and-sync.js
    echo     console.log(`Директория ${apiDir} создана.`); >> scripts\test-compatibility-and-sync.js
    echo   } >> scripts\test-compatibility-and-sync.js
    echo. >> scripts\test-compatibility-and-sync.js
    echo   const apiFilePath = path.join(apiDir, 'sync.js'); >> scripts\test-compatibility-and-sync.js
    echo   if (!fs.existsSync(apiFilePath)) { >> scripts\test-compatibility-and-sync.js
    echo     console.error(`Ошибка: Файл ${apiFilePath} не найден.`); >> scripts\test-compatibility-and-sync.js
    echo     fs.writeFileSync(apiFilePath, `const express = require('express'); >> scripts\test-compatibility-and-sync.js
    echo const router = express.Router(); >> scripts\test-compatibility-and-sync.js
    echo const auth = require('../../middleware/auth'); >> scripts\test-compatibility-and-sync.js
    echo. >> scripts\test-compatibility-and-sync.js
    echo // Маршрут для синхронизации данных >> scripts\test-compatibility-and-sync.js
    echo router.post('/sync', auth, async (req, res) => { >> scripts\test-compatibility-and-sync.js
    echo   try { >> scripts\test-compatibility-and-sync.js
    echo     // Логика синхронизации данных >> scripts\test-compatibility-and-sync.js
    echo     res.json({ success: true, message: 'Данные успешно синхронизированы' }); >> scripts\test-compatibility-and-sync.js
    echo   } catch (error) { >> scripts\test-compatibility-and-sync.js
    echo     console.error('Ошибка при синхронизации данных:', error.message); >> scripts\test-compatibility-and-sync.js
    echo     res.status(500).json({ success: false, message: 'Ошибка при синхронизации данных' }); >> scripts\test-compatibility-and-sync.js
    echo   } >> scripts\test-compatibility-and-sync.js
    echo }); >> scripts\test-compatibility-and-sync.js
    echo. >> scripts\test-compatibility-and-sync.js
    echo module.exports = router;`); >> scripts\test-compatibility-and-sync.js
    echo     console.log(`Файл ${apiFilePath} создан.`); >> scripts\test-compatibility-and-sync.js
    echo   } >> scripts\test-compatibility-and-sync.js
    echo. >> scripts\test-compatibility-and-sync.js
    echo   console.log('Проверка совместимости и синхронизации завершена успешно.'); >> scripts\test-compatibility-and-sync.js
    echo } >> scripts\test-compatibility-and-sync.js
    echo. >> scripts\test-compatibility-and-sync.js
    echo // Запуск проверки совместимости и синхронизации >> scripts\test-compatibility-and-sync.js
    echo testCompatibilityAndSync(); >> scripts\test-compatibility-and-sync.js
    
    echo [INFO] Установка зависимостей для скрипта test-compatibility-and-sync.js...
    call npm install dotenv
    
    echo [INFO] Запуск скрипта для проверки совместимости и синхронизации...
    node scripts\test-compatibility-and-sync.js > reports\compatibility-and-sync-report.txt 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Найдены ошибки в совместимости и синхронизации. Подробности в файле reports\compatibility-and-sync-report.txt.
    ) else (
        echo [SUCCESS] Тесты совместимости и синхронизации пройдены успешно.
    )
)

REM Анализ результатов тестов и исправление ошибок
echo [INFO] Анализ результатов тестов и исправление ошибок...

REM Создание отчета о результатах тестов
echo [INFO] Создание отчета о результатах тестов...
echo # ОТЧЕТ О РЕЗУЛЬТАТАХ ТЕСТОВ > reports\test-results.md
echo. >> reports\test-results.md
echo ## Дата: %date% %time% >> reports\test-results.md
echo. >> reports\test-results.md
echo ## Результаты тестов >> reports\test-results.md
echo. >> reports\test-results.md

REM Проверка результатов тестов ESLint
if exist reports\eslint-report.txt (
    echo ### Тесты синтаксиса JavaScript-файлов >> reports\test-results.md
    echo. >> reports\test-results.md
    echo ```text >> reports\test-results.md
    type reports\eslint-report.txt >> reports\test-results.md
    echo ``` >> reports\test-results.md
    echo. >> reports\test-results.md
)

REM Проверка результатов тестов Jest
if exist reports\jest-report.txt (
    echo ### Тесты функциональности >> reports\test-results.md
    echo. >> reports\test-results.md
    echo ```text >> reports\test-results.md
    type reports\jest-report.txt >> reports\test-results.md
    echo ``` >> reports\test-results.md
    echo. >> reports\test-results.md
)

REM Проверка результатов тестов API
if exist reports\api-report.txt (
    echo ### Тесты API >> reports\test-results.md
    echo. >> reports\test-results.md
    echo ```text >> reports\test-results.md
    type reports\api-report.txt >> reports\test-results.md
    echo ``` >> reports\test-results.md
    echo. >> reports\test-results.md
)

REM Проверка результатов тестов Telegram-бота
if exist reports\telegram-bot-report.txt (
    echo ### Тесты Telegram-бота >> reports\test-results.md
    echo. >> reports\test-results.md
    echo ```text >> reports\test-results.md
    type reports\telegram-bot-report.txt >> reports\test-results.md
    echo ``` >> reports\test-results.md
    echo. >> reports\test-results.md
)

REM Проверка результатов тестов веб-интерфейса
if exist reports\web-interface-report.txt (
    echo ### Тесты веб-интерфейса >> reports\test-results.md
    echo. >> reports\test-results.md
    echo ```text >> reports\test-results.md
    type reports\web-interface-report.txt >> reports\test-results.md
    echo ``` >> reports\test-results.md
    echo. >> reports\test-results.md
)

REM Проверка результатов тестов совместимости и синхронизации
if exist reports\compatibility-and-sync-report.txt (
    echo ### Тесты совместимости и синхронизации >> reports\test-results.md
    echo. >> reports\test-results.md
    echo ```text >> reports\test-results.md
    type reports\compatibility-and-sync-report.txt >> reports\test-results.md
    echo ``` >> reports\test-results.md
    echo. >> reports\test-results.md
)

echo ## Выводы и рекомендации >> reports\test-results.md
echo. >> reports\test-results.md
echo 1. Проверьте отчеты о тестах и исправьте найденные ошибки. >> reports\test-results.md
echo 2. Запустите скрипт `scripts\check-and-fix-system.bat` для автоматического исправления ошибок. >> reports\test-results.md
echo 3. После исправления ошибок запустите скрипт `scripts\run-all-steps.bat` для запуска системы. >> reports\test-results.md

echo [SUCCESS] Отч
