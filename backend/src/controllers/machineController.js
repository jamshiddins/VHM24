
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MachineController {
  async getMachines(req, res) {
    try {
      const machines = await prisma.machine.findMany({
        include: {
          location: true,
          tasks: {
            where: { status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] } },
            take: 5
          }
        }
      });
      res.json(machines);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMachine(req, res) {
    try {
      const machine = await prisma.machine.create({
        data: req.body,
        include: { location: true }
      });
      res.status(201).json(machine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMachineById(req, res) {
    try {
      const { id } = req.params;
      const machine = await prisma.machine.findUnique({
        where: { id },
        include: {
          location: true,
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          sales: {
            orderBy: { timestamp: 'desc' },
            take: 20
          },
          hopperInstallations: {
            include: { hopper: { include: { ingredient: true } } }
          }
        }
      });
      
      if (!machine) {
        return res.status(404).json({ error: 'Machine not found' });
      }
      
      res.json(machine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateMachine(req, res) {
    try {
      const { id } = req.params;
      const machine = await prisma.machine.update({
        where: { id },
        data: req.body,
        include: { location: true }
      });
      res.json(machine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MachineController();
