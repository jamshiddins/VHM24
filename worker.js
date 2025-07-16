const { Pool } = require('pg');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Получение параметров подключения из переменных окружения
const { DATABASE_URL } = process.env;

// Создание пула подключений
const pool = new Pool({ connectionString: DATABASE_URL });

// Функция для обработки задач
async function processJobs() {
  console.log('Обработка задач...');

  try {
    // Получение клиента из пула
    const client = await pool.connect();

    try {
      // Получение задач для обработки
      const result = await client.query(
        "SELECT * FROM tasks WHERE status = 'pending' ORDER BY priority DESC, created_at ASC LIMIT 10"
      );

      // Обработка задач
      for (const task of result.rows) {
        console.log(`Обработка задачи ${task.id}: ${task.title}`);

        // Обновление статуса задачи
        await client.query(
          "UPDATE tasks SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [task.id]
        );

        // Здесь можно добавить логику обработки задачи в зависимости от типа задачи
        switch (task.type) {
          case 'inventory':
            await processInventoryTask(client, task);
            break;
          case 'maintenance':
            await processMaintenanceTask(client, task);
            break;
          case 'collection':
            await processCollectionTask(client, task);
            break;
          default:
            await processDefaultTask(client, task);
            break;
        }

        // Обновление статуса задачи
        await client.query(
          "UPDATE tasks SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [task.id]
        );

        console.log(`Задача ${task.id} успешно обработана.`);
      }

      // Проверка и обновление статусов автоматов
      await updateMachineStatuses(client);

      // Проверка и обновление инвентаря
      await updateInventory(client);

    } finally {
      // Освобождение клиента
      client.release();
    }
  } catch (error) {
    console.error('Ошибка при обработке задач:', error.message);
  }
}

// Функция для обработки задачи инвентаризации
async function processInventoryTask(client, task) {
  console.log(`Обработка задачи инвентаризации ${task.id}`);
  
  // Логика обработки задачи инвентаризации
  // Например, проверка остатков и обновление инвентаря
  
  return true;
}

// Функция для обработки задачи технического обслуживания
async function processMaintenanceTask(client, task) {
  console.log(`Обработка задачи технического обслуживания ${task.id}`);
  
  // Логика обработки задачи технического обслуживания
  // Например, обновление статуса автомата и запись в журнал обслуживания
  
  return true;
}

// Функция для обработки задачи инкассации
async function processCollectionTask(client, task) {
  console.log(`Обработка задачи инкассации ${task.id}`);
  
  // Логика обработки задачи инкассации
  // Например, обновление статуса инкассации и запись в журнал инкассаций
  
  return true;
}

// Функция для обработки задачи по умолчанию
async function processDefaultTask(client, task) {
  console.log(`Обработка задачи по умолчанию ${task.id}`);
  
  // Логика обработки задачи по умолчанию
  
  return true;
}

// Функция для обновления статусов автоматов
async function updateMachineStatuses(client) {
  console.log('Обновление статусов автоматов...');
  
  try {
    // Получение всех автоматов
    const result = await client.query('SELECT * FROM machines');
    
    // Обновление статусов автоматов
    for (const machine of result.rows) {
      // Проверка времени последней активности
      const lastActive = new Date(machine.last_active);
      const now = new Date();
      const diffHours = (now - lastActive) / (1000 * 60 * 60);
      
      // Если автомат не активен более 24 часов, обновляем его статус
      if (diffHours > 24 && machine.status !== 'inactive') {
        await client.query(
          "UPDATE machines SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [machine.id]
        );
        console.log(`Автомат ${machine.id} помечен как неактивный.`);
      }
    }
    
    console.log('Обновление статусов автоматов завершено.');
  } catch (error) {
    console.error('Ошибка при обновлении статусов автоматов:', error.message);
  }
}

// Функция для обновления инвентаря
async function updateInventory(client) {
  console.log('Обновление инвентаря...');
  
  try {
    // Получение всех записей инвентаря
    const result = await client.query('SELECT * FROM inventory');
    
    // Обновление инвентаря
    for (const item of result.rows) {
      // Проверка количества
      if (item.quantity < 10) {
        console.log(`Внимание: Количество ${item.name} меньше 10 (${item.quantity} ${item.unit}).`);
        
        // Создание задачи на пополнение инвентаря
        await client.query(
          `INSERT INTO tasks (title, description, status, priority, type) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            `Пополнение ${item.name}`,
            `Необходимо пополнить запас ${item.name}. Текущее количество: ${item.quantity} ${item.unit}.`,
            'pending',
            'high',
            'inventory'
          ]
        );
        
        console.log(`Создана задача на пополнение ${item.name}.`);
      }
    }
    
    console.log('Обновление инвентаря завершено.');
  } catch (error) {
    console.error('Ошибка при обновлении инвентаря:', error.message);
  }
}

// Запуск обработки задач каждые 5 минут
setInterval(processJobs, 5 * 60 * 1000);

// Запуск обработки задач при старте
processJobs();

console.log('Worker запущен и работает...');
