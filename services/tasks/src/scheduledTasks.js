/**
 * VHM24 - Scheduled Tasks Module
 * Модуль для автоматического создания задач по расписанию и при дефиците товаров
 */

const cron = require('node-cron');
const { getTasksClient } = require('@vhm24/database');

// Создаем простой логгер
const logger = {
  info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args)
};

// Получаем Prisma клиент
const prisma = getTasksClient();

/**
 * Инициализация расписаний задач
 */
function initScheduledTasks() {
  logger.info('Initializing scheduled tasks...');

  // Ежедневная проверка дефицита товаров (в 6:00 утра)
  cron.schedule('0 6 * * *', async () => {
    logger.info('Running scheduled inventory check...');
    await createTasksForLowInventory();
  });

  // Еженедельное техническое обслуживание (в понедельник в 8:00 утра)
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Running scheduled maintenance tasks...');
    await createMaintenanceTasks();
  });

  // Ежемесячная инвентаризация (1-го числа каждого месяца в 7:00 утра)
  cron.schedule('0 7 1 * *', async () => {
    logger.info('Running scheduled inventory tasks...');
    await createInventoryTasks();
  });

  logger.info('Scheduled tasks initialized successfully');
}

/**
 * Создание задач при низком уровне запасов
 */
async function createTasksForLowInventory() {
  try {
    // Получаем все товары с низким уровнем запасов
    const lowInventoryItems = await prisma.inventoryItem.findMany({
      where: {
        quantity: {
          lt: prisma.inventoryItem.minQuantity
        }
      },
      include: {
        machine: true
      }
    });

    logger.info(`Found ${lowInventoryItems.length} items with low inventory`);

    // Группируем товары по машинам
    const itemsByMachine = lowInventoryItems.reduce((acc, item) => {
      if (!acc[item.machineId]) {
        acc[item.machineId] = [];
      }
      acc[item.machineId].push(item);
      return acc;
    }, {});

    // Создаем задачи для каждой машины
    for (const [machineId, items] of Object.entries(itemsByMachine)) {
      const machine = items[0].machine;
      
      // Формируем описание задачи
      const itemsList = items.map(item => 
        `- ${item.name}: ${item.quantity}/${item.minQuantity} ${item.unit}`
      ).join('\n');
      
      const description = `Необходимо пополнить запасы:\n${itemsList}`;
      
      // Создаем задачу
      const task = await prisma.task.create({
        data: {
          title: `Пополнение запасов для ${machine.name}`,
          description,
          machineId,
          status: 'CREATED',
          priority: 'HIGH',
          type: 'RESUPPLY',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Срок - 24 часа
        }
      });
      
      // Добавляем запись в историю действий
      await prisma.taskAction.create({
        data: {
          taskId: task.id,
          action: 'CREATED',
          comment: 'Задача создана автоматически из-за низкого уровня запасов',
          metadata: {
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              minQuantity: item.minQuantity
            }))
          }
        }
      });
      
      logger.info(`Created resupply task #${task.id} for machine ${machine.name}`);
      
      // Отправляем уведомление
      await sendTaskNotification(task, 'LOW_INVENTORY');
    }
    
    return true;
  } catch (error) {
    logger.error('Error creating tasks for low inventory:', error);
    return false;
  }
}

/**
 * Создание задач для планового технического обслуживания
 */
async function createMaintenanceTasks() {
  try {
    // Получаем все машины, которые не проходили ТО более 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const machines = await prisma.machine.findMany({
      where: {
        OR: [
          { lastMaintenanceDate: { lt: thirtyDaysAgo } },
          { lastMaintenanceDate: null }
        ]
      },
      include: {
        location: true
      }
    });
    
    logger.info(`Found ${machines.length} machines requiring maintenance`);
    
    // Создаем задачи для каждой машины
    for (const machine of machines) {
      const task = await prisma.task.create({
        data: {
          title: `Плановое ТО для ${machine.name}`,
          description: `Требуется плановое техническое обслуживание.\nПоследнее ТО: ${machine.lastMaintenanceDate ? new Date(machine.lastMaintenanceDate).toLocaleDateString('ru-RU') : 'Не проводилось'}`,
          machineId: machine.id,
          status: 'CREATED',
          priority: 'MEDIUM',
          type: 'MAINTENANCE',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Срок - 7 дней
        }
      });
      
      // Добавляем запись в историю действий
      await prisma.taskAction.create({
        data: {
          taskId: task.id,
          action: 'CREATED',
          comment: 'Задача создана автоматически по графику ТО',
          metadata: {
            lastMaintenance: machine.lastMaintenanceDate,
            location: machine.location?.name || 'Неизвестно'
          }
        }
      });
      
      logger.info(`Created maintenance task #${task.id} for machine ${machine.name}`);
      
      // Отправляем уведомление
      await sendTaskNotification(task, 'MAINTENANCE_REQUIRED');
    }
    
    return true;
  } catch (error) {
    logger.error('Error creating maintenance tasks:', error);
    return false;
  }
}

/**
 * Создание задач для инвентаризации
 */
async function createInventoryTasks() {
  try {
    // Получаем все машины
    const machines = await prisma.machine.findMany({
      include: {
        location: true
      }
    });
    
    logger.info(`Creating inventory tasks for ${machines.length} machines`);
    
    // Создаем задачи для каждой машины
    for (const machine of machines) {
      const task = await prisma.task.create({
        data: {
          title: `Инвентаризация для ${machine.name}`,
          description: `Требуется провести ежемесячную инвентаризацию.\nЛокация: ${machine.location?.name || 'Неизвестно'}`,
          machineId: machine.id,
          status: 'CREATED',
          priority: 'MEDIUM',
          type: 'INVENTORY',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // Срок - 5 дней
        }
      });
      
      // Добавляем запись в историю действий
      await prisma.taskAction.create({
        data: {
          taskId: task.id,
          action: 'CREATED',
          comment: 'Задача создана автоматически по графику инвентаризации',
          metadata: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            location: machine.location?.name || 'Неизвестно'
          }
        }
      });
      
      logger.info(`Created inventory task #${task.id} for machine ${machine.name}`);
      
      // Отправляем уведомление
      await sendTaskNotification(task, 'INVENTORY_REQUIRED');
    }
    
    return true;
  } catch (error) {
    logger.error('Error creating inventory tasks:', error);
    return false;
  }
}

/**
 * Отправка уведомления о задаче
 */
async function sendTaskNotification(task, type) {
  try {
    // Проверяем, доступен ли сервис уведомлений
    if (!global.notificationService) {
      logger.warn('Notification service not available, skipping notification');
      return false;
    }
    
    // Формируем данные для уведомления
    const notificationData = {
      type,
      taskId: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      machineId: task.machineId,
      dueDate: task.dueDate
    };
    
    try {
      // Отправляем уведомление
      await global.notificationService.sendTaskNotification(notificationData);
      
      logger.info(`Sent ${type} notification for task #${task.id}`);
      return true;
    } catch (notificationError) {
      logger.error(`Error sending notification for task #${task.id}:`, notificationError);
      return false;
    }
  } catch (error) {
    logger.error(`Error preparing notification for task #${task.id}:`, error);
    return false;
  }
}

/**
 * Ручной запуск проверки дефицита товаров
 */
async function manualCheckInventory() {
  logger.info('Manual inventory check triggered');
  return await createTasksForLowInventory();
}

/**
 * Ручной запуск создания задач ТО
 */
async function manualCreateMaintenanceTasks() {
  logger.info('Manual maintenance tasks creation triggered');
  return await createMaintenanceTasks();
}

/**
 * Ручной запуск создания задач инвентаризации
 */
async function manualCreateInventoryTasks() {
  logger.info('Manual inventory tasks creation triggered');
  return await createInventoryTasks();
}

module.exports = {
  initScheduledTasks,
  manualCheckInventory,
  manualCreateMaintenanceTasks,
  manualCreateInventoryTasks
};
