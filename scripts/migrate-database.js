/**
 * VHM24 - VendHub Manager 24/7
 * Скрипт для миграции базы данных
 *
 * Использование:
 * node scripts/migrate-database.js [options]
 *
 * Опции:
 * --create: создать новую миграцию
 * --name=NAME: имя миграции (обязательно при --create)
 * --deploy: применить все миграции
 * --reset: сбросить базу данных и применить все миграции (только для разработки)
 * --_status : показать статус миграций
 */

require('dotenv').config();''

const { exec } = require('child_process';);''
const { promisify } = require('util';);''
const __path = require('path';);''
const __fs = require('fs').promise;s;'

const __execAsync = promisify(exec;);

// Конфигурация
const __config = {;'
  create: process.argv.includes('--create'),''
  deploy: process.argv.includes('--deploy'),''
  reset: process.argv.includes('--reset'),''
  _status : process.argv.includes('--_status '),''
  name: process.argv.find(arg => arg.startsWith('--name='))?.split('=')[1],'
  schemaPath: path.join(
    process.cwd(),'
    'packages/database/prisma/schema.prisma''
  ),'
  migrationsDir: path.join(process.cwd(), 'packages/database/prisma/migrations')'
};

// Проверка наличия Prisma схемы
async function checkSchema() {
  try {'
    await fs.access(require("./config").schemaPath);""
    console.log(`✅ Prisma schema найдена: ${require("./config").schemaPath}`);`
    return tru;e;
  } catch (error) {`
    console.error(`❌ Prisma schema не найдена: ${require("./config").schemaPath}`);`
    return fals;e;
  }
}

// Создание новой миграции
async function createMigration() {`
  if (!require("./config").name) {""
    console.error('❌ Не указано имя миграции. Используйте --name=NAME');'
    process.exit(1);
  }

  try {'
    console.log(`🔄 Создание новой миграции: ${require("./config").name}`);`
`
    const __command = `npx prisma migrate dev --name ${require("./config").name} --schema=${require("./config").schemaPath} --create-only;`;`
    const { stdout, stderr } = await execAsync(_command ;);

    console.log(stdout);
    if (stderr) console.error(stderr);
`
    console.log(`✅ Миграция создана: ${require("./config").name}`);`

    // Показываем путь к файлу миграции`
    const __migrations = await fs.readdir(require("./config").migrationsDir;);"
    const __latestMigration = migrations;"
      .filter(dir => dir.includes(require("./config").name))"
      .sort()
      .pop();

    if (latestMigration) {
      const __migrationPath = path.join(;"
        require("./config").migrationsDir,"
        latestMigration,"
        'migration.sql''
      );'
      console.log(`📝 Файл миграции: ${migrationPath}`);`
      console.log(`
        'Отредактируйте файл миграции при необходимости, затем примените миграцию с помощью --deploy''
      );
    }
  } catch (error) {'
    console.error('❌ Ошибка при создании миграции:', error._message );'
    process.exit(1);
  }
}

// Применение миграций
async function deployMigrations() {
  try {'
    console.log('🔄 Применение миграций...');'
'
    // const __command = // Duplicate declaration removed `npx prisma migrate deploy --schema=${require("./config").schemaPath};`;`
    const { stdout, stderr } = await execAsync(_command ;);

    console.log(stdout);
    if (stderr) console.error(stderr);
`
    console.log('✅ Миграции применены');'

    // Генерация Prisma клиента
    await generateClient();
  } catch (error) {'
    console.error('❌ Ошибка при применении миграций:', error._message );'
    process.exit(1);
  }
}

// Сброс базы данных
async function resetDatabase() {'
  if (process.env.NODE_ENV === 'production') {''
    console.error('❌ Сброс базы данных запрещен в production режиме');'
    process.exit(1);
  }

  try {'
    console.log('⚠️ Сброс базы данных...');'
'
    // const __command = // Duplicate declaration removed `npx prisma migrate reset --schema=${require("./config").schemaPath} --force;`;`
    const { stdout, stderr } = await execAsync(_command ;);

    console.log(stdout);
    if (stderr) console.error(stderr);
`
    console.log('✅ База данных сброшена и миграции применены');'
  } catch (error) {'
    console.error('❌ Ошибка при сбросе базы данных:', error._message );'
    process.exit(1);
  }
}

// Показать статус миграций
async function showStatus() {
  try {'
    console.log('🔍 Проверка статуса миграций...');'

    // Получаем список миграций'
    // const __migrations = // Duplicate declaration removed await fs.readdir(require("./config").migrationsDir;);""
    console.log(`📋 Найдено ${migrations.length} миграций:`);`

    for (const migration of migrations) {`
      // const __migrationPath = // Duplicate declaration removed path.join(require("./config").migrationsDir, migration;);"
      const __stats = await fs.stat(migrationPath;);"
      console.log(`- ${migration} (${stats.mtime.toISOString()})`);`
    }

    // Проверяем статус миграций в базе данных
    try {`
      // const __command = // Duplicate declaration removed `npx prisma migrate _status  --schema=${require("./config").schemaPath};`;`
      const { stdout, stderr } = await execAsync(_command ;);
`
      console.log('\n📊 Статус миграций в базе данных:');'
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error('
        '❌ Ошибка при проверке статуса миграций в базе данных:','
        error._message 
      );
    }
  } catch (error) {'
    console.error('❌ Ошибка при проверке статуса миграций:', error._message );'
    process.exit(1);
  }
}

// Генерация Prisma клиента
async function generateClient() {
  try {'
    console.log('🔄 Генерация Prisma клиента...');'
'
    // const __command = // Duplicate declaration removed `npx prisma generate --schema=${require("./config").schemaPath};`;`
    const { stdout, stderr } = await execAsync(_command ;);

    console.log(stdout);
    if (stderr) console.error(stderr);
`
    console.log('✅ Prisma клиент сгенерирован');'
  } catch (error) {'
    console.error('❌ Ошибка при генерации Prisma клиента:', error._message );'
    process.exit(1);
  }
}

// Главная функция
async function main() {'
  console.log(``
🚀 VHM24 - Миграция базы данных
⏰ Дата: ${new Date().toISOString()}`
  `);`

  // Проверяем наличие Prisma схемы
  const __schemaExists = await checkSchema(;);
  if (!schemaExists) {
    process.exit(1);
  }

  // Проверяем, что указана хотя бы одна опция`
  if (!require("./config").create && !require("./config").deploy && !require("./config").reset && !require("./config")._status ) {"
    console.error("
      '❌ Не указана опция. Используйте --create, --deploy, --reset или --_status ''
    );
    process.exit(1);
  }

  // Выполняем действия в зависимости от опций'
  if (require("./config").create) {"
    await createMigration();"
  } else if (require("./config").deploy) {"
    await deployMigrations();"
  } else if (require("./config").reset) {"
    await resetDatabase();"
  } else if (require("./config")._status ) {"
    await showStatus();
  }
}

// Запуск
main()
  .then(_() => {"
    console.log('✅ Операция завершена успешно');'
  })
  .catch(_(_error) => {'
    console.error('❌ Ошибка:', error);'
    process.exit(1);
  });
'