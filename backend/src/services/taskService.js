const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TaskService {
  // Создать задачу с чек-листом
  async createTaskWithChecklist(taskData) {
    const { type, title, description, machineId, assignedToId, dueDate, checklists } = taskData;
    
    return await prisma.task.create({
      data: {
        type,
        title,
        description,
        machineId,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
        checklists: checklists ? {
          create: checklists.map(item => ({
            step: item.step,
            description: item.description,
            required: item.required || true
          }))
        } : undefined
      },
      include: {
        machine: {
          include: { location: true }
        },
        assignedTo: true,
        checklists: true
      }
    });
  }

  // Получить задачи по фильтрам
  async getTasks(filters = {}) {
    const { userId, status, type, machineId, routeId } = filters;
    
    const where = {};
    if (userId) where.assignedToId = userId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (machineId) where.machineId = machineId;
    if (routeId) where.routeId = routeId;
    
    return await prisma.task.findMany({
      where,
      include: {
        machine: {
          include: { location: true }
        },
        assignedTo: {
          select: { firstName: true, lastName: true, role: true }
        },
        checklists: true,
        bags: {
          include: {
            hoppers: {
              include: { hopper: { include: { ingredient: true } } }
            },
            syrups: {
              include: { syrup: true }
            }
          }
        },
        waterBottles: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Обновить статус задачи
  async updateTaskStatus(taskId, status, userId) {
    const updateData = { status };
    
    if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        machine: true,
        assignedTo: true,
        checklists: true
      }
    });

    // Логируем изменение статуса
    await prisma.actionLog.create({
      data: {
        userId,
        taskId,
        action: 'TASK_STATUS_UPDATE',
        details: { oldStatus: task.status, newStatus: status }
      }
    });

    return task;
  }

  // Обновить чек-лист
  async updateChecklist(checklistId, data, userId) {
    const { completed, photoUrl, weight, notes } = data;
    
    const checklist = await prisma.taskChecklist.update({
      where: { id: checklistId },
      data: {
        completed,
        photoUrl,
        weight,
        notes,
        completedAt: completed ? new Date() : null
      }
    });

    // Логируем обновление чек-листа
    await prisma.actionLog.create({
      data: {
        userId,
        taskId: checklist.taskId,
        action: 'CHECKLIST_UPDATE',
        details: { checklistId, completed, weight, notes }
      }
    });

    return checklist;
  }

  // Получить шаблоны чек-листов по типу задачи
  getChecklistTemplate(taskType) {
    const templates = {
      INGREDIENT_REPLACEMENT: [
        { step: 'Фото автомата до замены', required: true },
        { step: 'Снятие старых бункеров', required: true },
        { step: 'Установка новых бункеров', required: true },
        { step: 'Взвешивание снятых бункеров', required: true },
        { step: 'Фото автомата после замены', required: true }
      ],
      WATER_REPLACEMENT: [
        { step: 'Фото бутылок до замены', required: true },
        { step: 'Снятие старых бутылок', required: true },
        { step: 'Установка новых бутылок', required: true },
        { step: 'Взвешивание возвращенных бутылок', required: true }
      ],
      CLEANING: [
        { step: 'Фото автомата до чистки', required: true },
        { step: 'Внешняя чистка корпуса', required: true },
        { step: 'Внутренняя чистка', required: true },
        { step: 'Фото автомата после чистки', required: true },
        { step: 'Тестовая покупка', required: false }
      ],
      CASH_COLLECTION: [
        { step: 'Фото купюроприемника до', required: true },
        { step: 'Извлечение наличных', required: true },
        { step: 'Фото наличных', required: true },
        { step: 'Ввод суммы', required: true }
      ]
    };
    
    return templates[taskType] || [];
  }
}

module.exports = new TaskService();