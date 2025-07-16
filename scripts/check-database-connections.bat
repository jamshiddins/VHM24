@echo off
REM Скрипт для проверки подключений к базе данных и их соответствия

echo [INFO] Начало проверки подключений к базе данных...

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

REM Создание директории для отчетов
if not exist reports mkdir reports

REM Создание скрипта для проверки подключения к базе данных
echo [INFO] Создание скрипта для проверки подключения к базе данных...

echo const { Pool } = require('pg'); > scripts\test-database-connection.js
echo const dotenv = require('dotenv'); >> scripts\test-database-connection.js
echo const fs = require('fs'); >> scripts\test-database-connection.js
echo const path = require('path'); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo // Загрузка переменных окружения >> scripts\test-database-connection.js
echo dotenv.config(); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo // Функция для проверки подключения к базе данных >> scripts\test-database-connection.js
echo async function testDatabaseConnection() { >> scripts\test-database-connection.js
echo   console.log('Проверка подключения к базе данных...'); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo   // Получение параметров подключения из переменных окружения >> scripts\test-database-connection.js
echo   const { >> scripts\test-database-connection.js
echo     DB_HOST, >> scripts\test-database-connection.js
echo     DB_PORT, >> scripts\test-database-connection.js
echo     DB_USER, >> scripts\test-database-connection.js
echo     DB_PASSWORD, >> scripts\test-database-connection.js
echo     DB_NAME, >> scripts\test-database-connection.js
echo     DATABASE_URL >> scripts\test-database-connection.js
echo   } = process.env; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo   // Проверка наличия параметров подключения >> scripts\test-database-connection.js
echo   if (!DB_HOST && !DATABASE_URL) { >> scripts\test-database-connection.js
echo     console.error('Ошибка: Не указаны параметры подключения к базе данных (DB_HOST или DATABASE_URL).'); >> scripts\test-database-connection.js
echo     process.exit(1); >> scripts\test-database-connection.js
echo   } >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo   // Создание пула подключений >> scripts\test-database-connection.js
echo   const pool = DATABASE_URL >> scripts\test-database-connection.js
echo     ? new Pool({ connectionString: DATABASE_URL }) >> scripts\test-database-connection.js
echo     : new Pool({ >> scripts\test-database-connection.js
echo         host: DB_HOST, >> scripts\test-database-connection.js
echo         port: DB_PORT, >> scripts\test-database-connection.js
echo         user: DB_USER, >> scripts\test-database-connection.js
echo         password: DB_PASSWORD, >> scripts\test-database-connection.js
echo         database: DB_NAME >> scripts\test-database-connection.js
echo       }); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo   try { >> scripts\test-database-connection.js
echo     // Проверка подключения к базе данных >> scripts\test-database-connection.js
echo     const client = await pool.connect(); >> scripts\test-database-connection.js
echo     console.log('Подключение к базе данных успешно установлено.'); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo     // Проверка наличия таблиц >> scripts\test-database-connection.js
echo     const tablesResult = await client.query( >> scripts\test-database-connection.js
echo       "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" >> scripts\test-database-connection.js
echo     ); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo     console.log('Таблицы в базе данных:'); >> scripts\test-database-connection.js
echo     tablesResult.rows.forEach(row => { >> scripts\test-database-connection.js
echo       console.log(`- ${row.table_name}`); >> scripts\test-database-connection.js
echo     }); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo     // Проверка наличия необходимых таблиц >> scripts\test-database-connection.js
echo     const requiredTables = [ >> scripts\test-database-connection.js
echo       'users', >> scripts\test-database-connection.js
echo       'machines', >> scripts\test-database-connection.js
echo       'tasks', >> scripts\test-database-connection.js
echo       'bags', >> scripts\test-database-connection.js
echo       'collections', >> scripts\test-database-connection.js
echo       'sales', >> scripts\test-database-connection.js
echo       'inventory', >> scripts\test-database-connection.js
echo       'routes' >> scripts\test-database-connection.js
echo     ]; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo     const existingTables = tablesResult.rows.map(row => row.table_name); >> scripts\test-database-connection.js
echo     const missingTables = requiredTables.filter(table => !existingTables.includes(table)); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo     if (missingTables.length > 0) { >> scripts\test-database-connection.js
echo       console.error(`Ошибка: Отсутствуют следующие таблицы: ${missingTables.join(', ')}`); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo       // Создание отсутствующих таблиц >> scripts\test-database-connection.js
echo       console.log('Создание отсутствующих таблиц...'); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo       for (const table of missingTables) { >> scripts\test-database-connection.js
echo         console.log(`Создание таблицы ${table}...`); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo         switch (table) { >> scripts\test-database-connection.js
echo           case 'users': >> scripts\test-database-connection.js
echo             await client.query(` >> scripts\test-database-connection.js
echo               CREATE TABLE users ( >> scripts\test-database-connection.js
echo                 id SERIAL PRIMARY KEY, >> scripts\test-database-connection.js
echo                 username VARCHAR(255) NOT NULL, >> scripts\test-database-connection.js
echo                 password VARCHAR(255) NOT NULL, >> scripts\test-database-connection.js
echo                 role VARCHAR(50) NOT NULL, >> scripts\test-database-connection.js
echo                 telegram_id VARCHAR(255), >> scripts\test-database-connection.js
echo                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> scripts\test-database-connection.js
echo               ) >> scripts\test-database-connection.js
echo             `); >> scripts\test-database-connection.js
echo             break; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo           case 'machines': >> scripts\test-database-connection.js
echo             await client.query(` >> scripts\test-database-connection.js
echo               CREATE TABLE machines ( >> scripts\test-database-connection.js
echo                 id SERIAL PRIMARY KEY, >> scripts\test-database-connection.js
echo                 name VARCHAR(255) NOT NULL, >> scripts\test-database-connection.js
echo                 code VARCHAR(255) NOT NULL, >> scripts\test-database-connection.js
echo                 location VARCHAR(255), >> scripts\test-database-connection.js
echo                 status VARCHAR(50) NOT NULL, >> scripts\test-database-connection.js
echo                 last_active TIMESTAMP, >> scripts\test-database-connection.js
echo                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> scripts\test-database-connection.js
echo               ) >> scripts\test-database-connection.js
echo             `); >> scripts\test-database-connection.js
echo             break; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo           case 'tasks': >> scripts\test-database-connection.js
echo             await client.query(` >> scripts\test-database-connection.js
echo               CREATE TABLE tasks ( >> scripts\test-database-connection.js
echo                 id SERIAL PRIMARY KEY, >> scripts\test-database-connection.js
echo                 title VARCHAR(255) NOT NULL, >> scripts\test-database-connection.js
echo                 description TEXT, >> scripts\test-database-connection.js
echo                 status VARCHAR(50) NOT NULL, >> scripts\test-database-connection.js
echo                 priority VARCHAR(50), >> scripts\test-database-connection.js
echo                 assignee_id INTEGER REFERENCES users(id), >> scripts\test-database-connection.js
echo                 machine_id INTEGER REFERENCES machines(id), >> scripts\test-database-connection.js
echo                 due_date TIMESTAMP, >> scripts\test-database-connection.js
echo                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> scripts\test-database-connection.js
echo               ) >> scripts\test-database-connection.js
echo             `); >> scripts\test-database-connection.js
echo             break; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo           case 'bags': >> scripts\test-database-connection.js
echo             await client.query(` >> scripts\test-database-connection.js
echo               CREATE TABLE bags ( >> scripts\test-database-connection.js
echo                 id SERIAL PRIMARY KEY, >> scripts\test-database-connection.js
echo                 name VARCHAR(255) NOT NULL, >> scripts\test-database-connection.js
echo                 status VARCHAR(50) NOT NULL, >> scripts\test-database-connection.js
echo                 location VARCHAR(255), >> scripts\test-database-connection.js
echo                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> scripts\test-database-connection.js
echo               ) >> scripts\test-database-connection.js
echo             `); >> scripts\test-database-connection.js
echo             break; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo           case 'collections': >> scripts\test-database-connection.js
echo             await client.query(` >> scripts\test-database-connection.js
echo               CREATE TABLE collections ( >> scripts\test-database-connection.js
echo                 id SERIAL PRIMARY KEY, >> scripts\test-database-connection.js
echo                 machine_id INTEGER REFERENCES machines(id), >> scripts\test-database-connection.js
echo                 amount DECIMAL(10, 2) NOT NULL, >> scripts\test-database-connection.js
echo                 collected_by INTEGER REFERENCES users(id), >> scripts\test-database-connection.js
echo                 collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> scripts\test-database-connection.js
echo               ) >> scripts\test-database-connection.js
echo             `); >> scripts\test-database-connection.js
echo             break; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo           case 'sales': >> scripts\test-database-connection.js
echo             await client.query(` >> scripts\test-database-connection.js
echo               CREATE TABLE sales ( >> scripts\test-database-connection.js
echo                 id SERIAL PRIMARY KEY, >> scripts\test-database-connection.js
echo                 machine_id INTEGER REFERENCES machines(id), >> scripts\test-database-connection.js
echo                 product_name VARCHAR(255) NOT NULL, >> scripts\test-database-connection.js
echo                 amount DECIMAL(10, 2) NOT NULL, >> scripts\test-database-connection.js
echo                 payment_type VARCHAR(50) NOT NULL, >> scripts\test-database-connection.js
echo                 status VARCHAR(50) NOT NULL, >> scripts\test-database-connection.js
echo                 sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> scripts\test-database-connection.js
echo               ) >> scripts\test-database-connection.js
echo             `); >> scripts\test-database-connection.js
echo             break; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo           case 'inventory': >> scripts\test-database-connection.js
echo             await client.query(` >> scripts\test-database-connection.js
echo               CREATE TABLE inventory ( >> scripts\test-database-connection.js
echo                 id SERIAL PRIMARY KEY, >> scripts\test-database-connection.js
echo                 name VARCHAR(255) NOT NULL, >> scripts\test-database-connection.js
echo                 type VARCHAR(50) NOT NULL, >> scripts\test-database-connection.js
echo                 quantity DECIMAL(10, 2) NOT NULL, >> scripts\test-database-connection.js
echo                 unit VARCHAR(50) NOT NULL, >> scripts\test-database-connection.js
echo                 location VARCHAR(255), >> scripts\test-database-connection.js
echo                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> scripts\test-database-connection.js
echo               ) >> scripts\test-database-connection.js
echo             `); >> scripts\test-database-connection.js
echo             break; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo           case 'routes': >> scripts\test-database-connection.js
echo             await client.query(` >> scripts\test-database-connection.js
echo               CREATE TABLE routes ( >> scripts\test-database-connection.js
echo                 id SERIAL PRIMARY KEY, >> scripts\test-database-connection.js
echo                 name VARCHAR(255) NOT NULL, >> scripts\test-database-connection.js
echo                 description TEXT, >> scripts\test-database-connection.js
echo                 assignee_id INTEGER REFERENCES users(id), >> scripts\test-database-connection.js
echo                 status VARCHAR(50) NOT NULL, >> scripts\test-database-connection.js
echo                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> scripts\test-database-connection.js
echo                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> scripts\test-database-connection.js
echo               ) >> scripts\test-database-connection.js
echo             `); >> scripts\test-database-connection.js
echo             break; >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo           default: >> scripts\test-database-connection.js
echo             console.error(`Ошибка: Неизвестная таблица ${table}`); >> scripts\test-database-connection.js
echo             break; >> scripts\test-database-connection.js
echo         } >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo         console.log(`Таблица ${table} успешно создана.`); >> scripts\test-database-connection.js
echo       } >> scripts\test-database-connection.js
echo     } else { >> scripts\test-database-connection.js
echo       console.log('Все необходимые таблицы присутствуют в базе данных.'); >> scripts\test-database-connection.js
echo     } >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo     // Освобождение клиента >> scripts\test-database-connection.js
echo     client.release(); >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo     console.log('Проверка подключения к базе данных завершена успешно.'); >> scripts\test-database-connection.js
echo   } catch (error) { >> scripts\test-database-connection.js
echo     console.error('Ошибка при подключении к базе данных:', error.message); >> scripts\test-database-connection.js
echo     process.exit(1); >> scripts\test-database-connection.js
echo   } finally { >> scripts\test-database-connection.js
echo     // Закрытие пула подключений >> scripts\test-database-connection.js
echo     await pool.end(); >> scripts\test-database-connection.js
echo   } >> scripts\test-database-connection.js
echo } >> scripts\test-database-connection.js
echo. >> scripts\test-database-connection.js
echo // Запуск проверки подключения к базе данных >> scripts\test-database-connection.js
echo testDatabaseConnection(); >> scripts\test-database-connection.js

echo [INFO] Установка зависимостей для скрипта test-database-connection.js...
call npm install pg dotenv

echo [INFO] Запуск скрипта для проверки подключения к базе данных...
node scripts\test-database-connection.js > reports\database-connection-report.txt 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Найдены ошибки при подключении к базе данных. Подробности в файле reports\database-connection-report.txt.
) else (
    echo [SUCCESS] Подключение к базе данных успешно установлено.
)

REM Создание скрипта для настройки worker и scheduler в Railway
echo [INFO] Создание скрипта для настройки worker и scheduler в Railway...

echo const fs = require('fs'); > scripts\setup-railway-worker-scheduler.js
echo const path = require('path'); >> scripts\setup-railway-worker-scheduler.js
echo const { execSync } = require('child_process'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Функция для настройки worker и scheduler в Railway >> scripts\setup-railway-worker-scheduler.js
echo function setupRailwayWorkerScheduler() { >> scripts\setup-railway-worker-scheduler.js
echo   console.log('Настройка worker и scheduler в Railway...'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo   // Проверка наличия файла railway.json >> scripts\setup-railway-worker-scheduler.js
echo   const railwayJsonPath = path.join(__dirname, '..', 'railway.json'); >> scripts\setup-railway-worker-scheduler.js
echo   if (!fs.existsSync(railwayJsonPath)) { >> scripts\setup-railway-worker-scheduler.js
echo     console.error(`Ошибка: Файл ${railwayJsonPath} не найден.`); >> scripts\setup-railway-worker-scheduler.js
echo     console.log('Создание файла railway.json...'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo     const railwayJson = { >> scripts\setup-railway-worker-scheduler.js
echo       "$schema": "https://railway.app/railway.schema.json", >> scripts\setup-railway-worker-scheduler.js
echo       "build": { >> scripts\setup-railway-worker-scheduler.js
echo         "builder": "NIXPACKS", >> scripts\setup-railway-worker-scheduler.js
echo         "buildCommand": "npm install" >> scripts\setup-railway-worker-scheduler.js
echo       }, >> scripts\setup-railway-worker-scheduler.js
echo       "deploy": { >> scripts\setup-railway-worker-scheduler.js
echo         "restartPolicyType": "ON_FAILURE", >> scripts\setup-railway-worker-scheduler.js
echo         "restartPolicyMaxRetries": 10 >> scripts\setup-railway-worker-scheduler.js
echo       } >> scripts\setup-railway-worker-scheduler.js
echo     }; >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo     fs.writeFileSync(railwayJsonPath, JSON.stringify(railwayJson, null, 2)); >> scripts\setup-railway-worker-scheduler.js
echo     console.log(`Файл ${railwayJsonPath} успешно создан.`); >> scripts\setup-railway-worker-scheduler.js
echo   } else { >> scripts\setup-railway-worker-scheduler.js
echo     console.log(`Файл ${railwayJsonPath} найден.`); >> scripts\setup-railway-worker-scheduler.js
echo   } >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo   // Создание файлов для worker и scheduler >> scripts\setup-railway-worker-scheduler.js
echo   console.log('Создание файлов для worker и scheduler...'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo   // Создание файла worker.js >> scripts\setup-railway-worker-scheduler.js
echo   const workerJsPath = path.join(__dirname, '..', 'worker.js'); >> scripts\setup-railway-worker-scheduler.js
echo   if (!fs.existsSync(workerJsPath)) { >> scripts\setup-railway-worker-scheduler.js
echo     console.log('Создание файла worker.js...'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo     const workerJs = `const { Pool } = require('pg'); >> scripts\setup-railway-worker-scheduler.js
echo const dotenv = require('dotenv'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Загрузка переменных окружения >> scripts\setup-railway-worker-scheduler.js
echo dotenv.config(); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Получение параметров подключения из переменных окружения >> scripts\setup-railway-worker-scheduler.js
echo const { DATABASE_URL } = process.env; >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Создание пула подключений >> scripts\setup-railway-worker-scheduler.js
echo const pool = new Pool({ connectionString: DATABASE_URL }); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Функция для обработки задач >> scripts\setup-railway-worker-scheduler.js
echo async function processJobs() { >> scripts\setup-railway-worker-scheduler.js
echo   console.log('Обработка задач...'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo   try { >> scripts\setup-railway-worker-scheduler.js
echo     // Получение клиента из пула >> scripts\setup-railway-worker-scheduler.js
echo     const client = await pool.connect(); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo     try { >> scripts\setup-railway-worker-scheduler.js
echo       // Получение задач для обработки >> scripts\setup-railway-worker-scheduler.js
echo       const result = await client.query( >> scripts\setup-railway-worker-scheduler.js
echo         "SELECT * FROM tasks WHERE status = 'pending' ORDER BY priority DESC, created_at ASC LIMIT 10" >> scripts\setup-railway-worker-scheduler.js
echo       ); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo       // Обработка задач >> scripts\setup-railway-worker-scheduler.js
echo       for (const task of result.rows) { >> scripts\setup-railway-worker-scheduler.js
echo         console.log(\`Обработка задачи \${task.id}: \${task.title}\`); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo         // Обновление статуса задачи >> scripts\setup-railway-worker-scheduler.js
echo         await client.query( >> scripts\setup-railway-worker-scheduler.js
echo           "UPDATE tasks SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = $1", >> scripts\setup-railway-worker-scheduler.js
echo           [task.id] >> scripts\setup-railway-worker-scheduler.js
echo         ); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo         // Здесь можно добавить логику обработки задачи >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo         // Обновление статуса задачи >> scripts\setup-railway-worker-scheduler.js
echo         await client.query( >> scripts\setup-railway-worker-scheduler.js
echo           "UPDATE tasks SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", >> scripts\setup-railway-worker-scheduler.js
echo           [task.id] >> scripts\setup-railway-worker-scheduler.js
echo         ); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo         console.log(\`Задача \${task.id} успешно обработана.\`); >> scripts\setup-railway-worker-scheduler.js
echo       } >> scripts\setup-railway-worker-scheduler.js
echo     } finally { >> scripts\setup-railway-worker-scheduler.js
echo       // Освобождение клиента >> scripts\setup-railway-worker-scheduler.js
echo       client.release(); >> scripts\setup-railway-worker-scheduler.js
echo     } >> scripts\setup-railway-worker-scheduler.js
echo   } catch (error) { >> scripts\setup-railway-worker-scheduler.js
echo     console.error('Ошибка при обработке задач:', error.message); >> scripts\setup-railway-worker-scheduler.js
echo   } >> scripts\setup-railway-worker-scheduler.js
echo } >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Запуск обработки задач каждые 5 минут >> scripts\setup-railway-worker-scheduler.js
echo setInterval(processJobs, 5 * 60 * 1000); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Запуск обработки задач при старте >> scripts\setup-railway-worker-scheduler.js
echo processJobs();`; >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo     fs.writeFileSync(workerJsPath, workerJs); >> scripts\setup-railway-worker-scheduler.js
echo     console.log(`Файл ${workerJsPath} успешно создан.`); >> scripts\setup-railway-worker-scheduler.js
echo   } else { >> scripts\setup-railway-worker-scheduler.js
echo     console.log(`Файл ${workerJsPath} найден.`); >> scripts\setup-railway-worker-scheduler.js
echo   } >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo   // Создание файла scheduler.js >> scripts\setup-railway-worker-scheduler.js
echo   const schedulerJsPath = path.join(__dirname, '..', 'scheduler.js'); >> scripts\setup-railway-worker-scheduler.js
echo   if (!fs.existsSync(schedulerJsPath)) { >> scripts\setup-railway-worker-scheduler.js
echo     console.log('Создание файла scheduler.js...'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo     const schedulerJs = `const { Pool } = require('pg'); >> scripts\setup-railway-worker-scheduler.js
echo const dotenv = require('dotenv'); >> scripts\setup-railway-worker-scheduler.js
echo const cron = require('node-cron'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Загрузка переменных окружения >> scripts\setup-railway-worker-scheduler.js
echo dotenv.config(); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Получение параметров подключения из переменных окружения >> scripts\setup-railway-worker-scheduler.js
echo const { DATABASE_URL } = process.env; >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Создание пула подключений >> scripts\setup-railway-worker-scheduler.js
echo const pool = new Pool({ connectionString: DATABASE_URL }); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo // Функция для создания задач >> scripts\setup-railway-worker-scheduler.js
echo async function createTasks() { >> scripts\setup-railway-worker-scheduler.js
echo   console.log('Создание задач...'); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo   try { >> scripts\setup-railway-worker-scheduler.js
echo     // Получение клиента из пула >> scripts\setup-railway-worker-scheduler.js
echo     const client = await pool.connect(); >> scripts\setup-railway-worker-scheduler.js
echo. >> scripts\setup-railway-worker-scheduler.js
echo     try { >> scripts\setup-railway-worker-scheduler.js
echo       // Получение всех автоматов >> scripts\
