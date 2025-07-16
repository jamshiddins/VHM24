const { Pool } = require('pg');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Загрузка переменных окружения
dotenv.config();

// Получение параметров подключения из переменных окружения
const { DATABASE_URL } = process.env;

// Создание пула подключений
const pool = new Pool({ connectionString: DATABASE_URL });

// Функция для создания регулярных задач
async function createScheduledTasks() {
  console.log('Создание регулярных задач...');

  try {
    // Получение клиента из пула
    const client = await pool.connect();

    try {
      // Получение всех автоматов
      const machinesResult = await client.query('SELECT * FROM machines WHERE status = $1', ['active']);
      
      // Создание задач для каждого активного автомата
      for (const machine of machinesResult.rows) {
        // Создание задачи инкассации (раз в неделю)
        await createCollectionTask(client, machine);
        
        // Создание задачи технического обслуживания (раз в месяц)
        await createMaintenanceTask(client, machine);
      }
      
      // Создание задач инвентаризации (раз в неделю)
      await createInventoryTasks(client);
      
      // Создание задач аналитики (ежедневно)
      await createAnalyticsTasks(client);
      
      console.log('Регулярные задачи успешно созданы.');
    } finally {
      // Освобождение клиента
      client.release();
    }
  } catch (error) {
    console.error('Ошибка при создании регулярных задач:', error.message);
  }
}

// Функция для создания задачи инкассации
async function createCollectionTask(client, machine) {
  console.log(`Создание задачи инкассации для автомата ${machine.id}...`);
  
  try {
    // Проверка, существует ли уже активная задача инкассации для этого автомата
    const existingTaskResult = await client.query(
      `SELECT * FROM tasks 
       WHERE machine_id = $1 
       AND type = $2 
       AND status IN ($3, $4) 
       AND due_date > CURRENT_TIMESTAMP`,
      [machine.id, 'collection', 'pending', 'processing']
    );
    
    // Если задача уже существует, пропускаем создание новой
    if (existingTaskResult.rows.length > 0) {
      console.log(`Задача инкассации для автомата ${machine.id} уже существует.`);
      return;
    }
    
    // Создание новой задачи инкассации
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Срок выполнения через неделю
    
    await client.query(
      `INSERT INTO tasks (title, description, status, priority, type, machine_id, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `Инкассация автомата ${machine.name}`,
        `Необходимо провести инкассацию автомата ${machine.name} (${machine.code}) по адресу ${machine.location}.`,
        'pending',
        'medium',
        'collection',
        machine.id,
        dueDate
      ]
    );
    
    console.log(`Задача инкассации для автомата ${machine.id} успешно создана.`);
  } catch (error) {
    console.error(`Ошибка при создании задачи инкассации для автомата ${machine.id}:`, error.message);
  }
}

// Функция для создания задачи технического обслуживания
async function createMaintenanceTask(client, machine) {
  console.log(`Создание задачи технического обслуживания для автомата ${machine.id}...`);
  
  try {
    // Проверка, существует ли уже активная задача технического обслуживания для этого автомата
    const existingTaskResult = await client.query(
      `SELECT * FROM tasks 
       WHERE machine_id = $1 
       AND type = $2 
       AND status IN ($3, $4) 
       AND due_date > CURRENT_TIMESTAMP`,
      [machine.id, 'maintenance', 'pending', 'processing']
    );
    
    // Если задача уже существует, пропускаем создание новой
    if (existingTaskResult.rows.length > 0) {
      console.log(`Задача технического обслуживания для автомата ${machine.id} уже существует.`);
      return;
    }
    
    // Создание новой задачи технического обслуживания
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1); // Срок выполнения через месяц
    
    await client.query(
      `INSERT INTO tasks (title, description, status, priority, type, machine_id, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `Техническое обслуживание автомата ${machine.name}`,
        `Необходимо провести техническое обслуживание автомата ${machine.name} (${machine.code}) по адресу ${machine.location}.`,
        'pending',
        'low',
        'maintenance',
        machine.id,
        dueDate
      ]
    );
    
    console.log(`Задача технического обслуживания для автомата ${machine.id} успешно создана.`);
  } catch (error) {
    console.error(`Ошибка при создании задачи технического обслуживания для автомата ${machine.id}:`, error.message);
  }
}

// Функция для создания задач инвентаризации
async function createInventoryTasks(client) {
  console.log('Создание задач инвентаризации...');
  
  try {
    // Проверка, существует ли уже активная задача инвентаризации
    const existingTaskResult = await client.query(
      `SELECT * FROM tasks 
       WHERE type = $1 
       AND status IN ($2, $3) 
       AND due_date > CURRENT_TIMESTAMP`,
      ['inventory', 'pending', 'processing']
    );
    
    // Если задача уже существует, пропускаем создание новой
    if (existingTaskResult.rows.length > 0) {
      console.log('Задача инвентаризации уже существует.');
      return;
    }
    
    // Создание новой задачи инвентаризации
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Срок выполнения через неделю
    
    await client.query(
      `INSERT INTO tasks (title, description, status, priority, type, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'Инвентаризация склада',
        'Необходимо провести инвентаризацию склада и обновить данные в системе.',
        'pending',
        'medium',
        'inventory',
        dueDate
      ]
    );
    
    console.log('Задача инвентаризации успешно создана.');
  } catch (error) {
    console.error('Ошибка при создании задачи инвентаризации:', error.message);
  }
}

// Функция для создания задач аналитики
async function createAnalyticsTasks(client) {
  console.log('Создание задач аналитики...');
  
  try {
    // Проверка, существует ли уже активная задача аналитики
    const existingTaskResult = await client.query(
      `SELECT * FROM tasks 
       WHERE type = $1 
       AND status IN ($2, $3) 
       AND due_date > CURRENT_TIMESTAMP`,
      ['analytics', 'pending', 'processing']
    );
    
    // Если задача уже существует, пропускаем создание новой
    if (existingTaskResult.rows.length > 0) {
      console.log('Задача аналитики уже существует.');
      return;
    }
    
    // Создание новой задачи аналитики
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Срок выполнения через день
    
    await client.query(
      `INSERT INTO tasks (title, description, status, priority, type, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'Анализ продаж',
        'Необходимо провести анализ продаж и подготовить отчет.',
        'pending',
        'low',
        'analytics',
        dueDate
      ]
    );
    
    console.log('Задача аналитики успешно создана.');
  } catch (error) {
    console.error('Ошибка при создании задачи аналитики:', error.message);
  }
}

// Функция для очистки старых задач
async function cleanupOldTasks() {
  console.log('Очистка старых задач...');
  
  try {
    // Получение клиента из пула
    const client = await pool.connect();
    
    try {
      // Архивация старых выполненных задач (старше 30 дней)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await client.query(
        `UPDATE tasks 
         SET status = 'archived' 
         WHERE status = 'completed' 
         AND updated_at < $1`,
        [thirtyDaysAgo]
      );
      
      console.log(`Архивировано ${result.rowCount} старых задач.`);
    } finally {
      // Освобождение клиента
      client.release();
    }
  } catch (error) {
    console.error('Ошибка при очистке старых задач:', error.message);
  }
}

// Функция для создания отчетов
async function generateReports() {
  console.log('Создание отчетов...');
  
  try {
    // Получение клиента из пула
    const client = await pool.connect();
    
    try {
      // Получение данных о продажах за последний день
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const salesResult = await client.query(
        `SELECT 
           machine_id, 
           COUNT(*) as sales_count, 
           SUM(amount) as sales_amount 
         FROM sales 
         WHERE sold_at >= $1 
         GROUP BY machine_id`,
        [yesterday]
      );
      
      // Получение данных о машинах
      const machinesResult = await client.query('SELECT id, name, code, location FROM machines');
      
      // Создание отчета
      const report = {
        date: new Date().toISOString().split('T')[0],
        sales: salesResult.rows.map(sale => {
          const machine = machinesResult.rows.find(m => m.id === sale.machine_id);
          return {
            machine_id: sale.machine_id,
            machine_name: machine ? machine.name : 'Unknown',
            machine_code: machine ? machine.code : 'Unknown',
            machine_location: machine ? machine.location : 'Unknown',
            sales_count: parseInt(sale.sales_count),
            sales_amount: parseFloat(sale.sales_amount)
          };
        }),
        total_sales_count: salesResult.rows.reduce((sum, sale) => sum + parseInt(sale.sales_count), 0),
        total_sales_amount: salesResult.rows.reduce((sum, sale) => sum + parseFloat(sale.sales_amount), 0)
      };
      
      // Сохранение отчета в базу данных
      // Проверка наличия таблицы reports
      const tableExists = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports')"
      );
      
      if (!tableExists.rows[0].exists) {
        // Создание таблицы reports, если она не существует
        await client.query(`
          CREATE TABLE reports (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            type VARCHAR(50) NOT NULL,
            data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('Таблица reports успешно создана.');
      }
      
      // Сохранение отчета
      await client.query(
        `INSERT INTO reports (date, type, data) VALUES ($1, $2, $3)`,
        [report.date, 'daily_sales', JSON.stringify(report)]
      );
      
      console.log(`Отчет о продажах за ${report.date} успешно создан.`);
    } finally {
      // Освобождение клиента
      client.release();
    }
  } catch (error) {
    console.error('Ошибка при создании отчетов:', error.message);
  }
}

// Планирование задач с использованием cron

// Создание регулярных задач каждый день в 00:00
cron.schedule('0 0 * * *', createScheduledTasks);

// Очистка старых задач каждую неделю в воскресенье в 01:00
cron.schedule('0 1 * * 0', cleanupOldTasks);

// Создание отчетов каждый день в 02:00
cron.schedule('0 2 * * *', generateReports);

// Запуск создания регулярных задач при старте
createScheduledTasks();

console.log('Scheduler запущен и работает...');
