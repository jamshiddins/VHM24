
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true }
      });
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'User account is not active' });
      }
      
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      req.userRole = user.role;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Здесь должна быть логика проверки JWT токена
    // Для простоты пока пропускаем
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  checkRole,
  requireAuth
};
