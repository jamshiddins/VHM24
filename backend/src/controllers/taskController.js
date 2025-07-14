const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TaskController {
  // Получить задачи
  async getTasks(req, res) {
    try {
      const { userId, status, type, machineId } = req.query;
      
      const where = {};
      if (userId) where.assignedToId = userId;
      if (status) where.status = status;
      if (type) where.type = type;
      if (machineId) where.machineId = machineId;
      
      const tasks = await prisma.task.findMany({
        where,
        include: {
          machine: {
            include: { location: true }
          },
          assignedTo: {
            select: { firstName: true, lastName: true, role: true }
          },
          checklists: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Создать задачу
  async createTask(req, res) {
    try {
      const { type, title, description, machineId, assignedToId, dueDate, checklists } = req.body;
      
      const task = await prisma.task.create({
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
          machine: true,
          assignedTo: true,
          checklists: true
        }
      });
      
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Обновить статус задачи
  async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updateData = { status };
      
      if (status === 'IN_PROGRESS') {
        updateData.startedAt = new Date();
      } else if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
      
      const task = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          machine: true,
          assignedTo: true,
          checklists: true
        }
      });
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Обновить чек-лист
  async updateChecklist(req, res) {
    try {
      const { id } = req.params;
      const { completed, photoUrl, weight, notes } = req.body;
      
      const checklist = await prisma.taskChecklist.update({
        where: { id },
        data: {
          completed,
          photoUrl,
          weight,
          notes,
          completedAt: completed ? new Date() : null
        }
      });
      
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TaskController();