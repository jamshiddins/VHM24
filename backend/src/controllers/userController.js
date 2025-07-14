
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UserController {
  async getUsers(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          telegramId: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true
        }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const { telegramId, name, phone, role } = req.body;
      const user = await prisma.user.create({
        data: { telegramId, name, phone, role }
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          assignedTasks: true,
          actionLogs: {
            take: 10,
            orderBy: { timestamp: 'desc' }
          }
        }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await prisma.user.update({
        where: { id },
        data: updateData
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await prisma.user.delete({
        where: { id }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
