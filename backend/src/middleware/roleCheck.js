const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Middleware для проверки JWT токена и извлечения пользователя
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }
    
    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Получаем пользователя из базы данных
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true,
        telegramId: true,
        telegramUsername: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'User account is disabled',
        code: 'USER_DISABLED'
      });
    }
    
    // Добавляем пользователя в объект запроса
    req.user = user;
    
    logger.info('User authenticated', {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      endpoint: req.path,
      method: req.method
    });
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
      endpoint: req.path
    });
    
    return res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware для проверки ролей пользователя
 * @param {string|string[]} requiredRoles - Требуемые роли (строка или массив)
 * @param {object} options - Дополнительные опции
 * @param {boolean} options.requireAll - Требовать все роли (по умолчанию false - достаточно одной)
 * @param {boolean} options.allowSelf - Разрешить доступ к собственным данным (по умолчанию false)
 */
const checkRole = (requiredRoles, options = {}) => {
  const { requireAll = false, allowSelf = false } = options;
  
  return async (req, res, next) => {
    try {
      // Проверяем, что пользователь аутентифицирован
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }
      
      const userRoles = req.user.roles || [];
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      // Проверяем роли
      let hasAccess = false;
      
      if (requireAll) {
        // Требуются ВСЕ роли
        hasAccess = roles.every(role => userRoles.includes(role));
      } else {
        // Достаточно ОДНОЙ роли
        hasAccess = roles.some(role => userRoles.includes(role));
      }
      
      // Проверяем доступ к собственным данным
      if (!hasAccess && allowSelf) {
        const resourceUserId = req.params.userId || req.params.id || req.body.userId;
        if (resourceUserId && resourceUserId === req.user.id) {
          hasAccess = true;
          logger.info('Access granted for own resource', {
            userId: req.user.id,
            resourceUserId,
            endpoint: req.path
          });
        }
      }
      
      if (!hasAccess) {
        logger.warn('Access denied - insufficient roles', {
          userId: req.user.id,
          userRoles,
          requiredRoles: roles,
          requireAll,
          endpoint: req.path,
          method: req.method
        });
        
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_ROLES',
          required: roles,
          current: userRoles
        });
      }
      
      logger.info('Role check passed', {
        userId: req.user.id,
        userRoles,
        requiredRoles: roles,
        endpoint: req.path
      });
      
      next();
    } catch (error) {
      logger.error('Role check error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        endpoint: req.path
      });
      
      return res.status(500).json({ 
        error: 'Authorization failed',
        code: 'AUTH_ERROR'
      });
    }
  };
};

/**
 * Middleware для проверки конкретных разрешений
 * @param {string|string[]} permissions - Требуемые разрешения
 */
const checkPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }
      
      // TODO: Реализовать систему разрешений
      // Пока используем роли как разрешения
      const userRoles = req.user.roles || [];
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      
      const hasPermission = requiredPermissions.some(permission => 
        userRoles.includes(permission)
      );
      
      if (!hasPermission) {
        logger.warn('Access denied - insufficient permissions', {
          userId: req.user.id,
          userRoles,
          requiredPermissions,
          endpoint: req.path
        });
        
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermissions,
          current: userRoles
        });
      }
      
      next();
    } catch (error) {
      logger.error('Permission check error', {
        error: error.message,
        userId: req.user?.id,
        endpoint: req.path
      });
      
      return res.status(500).json({ 
        error: 'Permission check failed',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

/**
 * Middleware для проверки владельца ресурса
 * @param {string} resourceField - Поле в req.params или req.body для получения ID ресурса
 * @param {string} ownerField - Поле в модели для проверки владельца (по умолчанию 'userId')
 * @param {string} model - Название модели Prisma для проверки
 */
const checkOwnership = (resourceField, model, ownerField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }
      
      const resourceId = req.params[resourceField] || req.body[resourceField];
      
      if (!resourceId) {
        return res.status(400).json({ 
          error: `${resourceField} is required`,
          code: 'MISSING_RESOURCE_ID'
        });
      }
      
      // Получаем ресурс из базы данных
      const resource = await prisma[model].findUnique({
        where: { id: resourceId },
        select: { [ownerField]: true }
      });
      
      if (!resource) {
        return res.status(404).json({ 
          error: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }
      
      // Проверяем владельца
      if (resource[ownerField] !== req.user.id) {
        // Проверяем, есть ли у пользователя роль ADMIN
        if (!req.user.roles.includes('ADMIN')) {
          logger.warn('Access denied - not owner', {
            userId: req.user.id,
            resourceId,
            ownerId: resource[ownerField],
            model,
            endpoint: req.path
          });
          
          return res.status(403).json({ 
            error: 'Access denied - not owner',
            code: 'NOT_OWNER'
          });
        }
      }
      
      // Добавляем ресурс в запрос для дальнейшего использования
      req.resource = resource;
      
      next();
    } catch (error) {
      logger.error('Ownership check error', {
        error: error.message,
        userId: req.user?.id,
        resourceField,
        model,
        endpoint: req.path
      });
      
      return res.status(500).json({ 
        error: 'Ownership check failed',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

/**
 * Предопределенные роли для удобства
 */
const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  WAREHOUSE: 'WAREHOUSE',
  OPERATOR: 'OPERATOR',
  TECHNICIAN: 'TECHNICIAN',
  DRIVER: 'DRIVER'
};

/**
 * Предопределенные комбинации ролей
 */
const ROLE_GROUPS = {
  // Административные роли
  ADMIN_ROLES: [ROLES.ADMIN],
  
  // Управленческие роли
  MANAGEMENT_ROLES: [ROLES.ADMIN, ROLES.MANAGER],
  
  // Складские роли
  WAREHOUSE_ROLES: [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE],
  
  // Операционные роли
  OPERATIONAL_ROLES: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR],
  
  // Технические роли
  TECHNICAL_ROLES: [ROLES.ADMIN, ROLES.TECHNICIAN],
  
  // Логистические роли
  LOGISTICS_ROLES: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER],
  
  // Все роли
  ALL_ROLES: Object.values(ROLES)
};

/**
 * Вспомогательные функции для создания middleware
 */
const requireAdmin = () => checkRole(ROLES.ADMIN);
const requireManager = () => checkRole(ROLE_GROUPS.MANAGEMENT_ROLES);
const requireWarehouse = () => checkRole(ROLE_GROUPS.WAREHOUSE_ROLES);
const requireOperator = () => checkRole(ROLE_GROUPS.OPERATIONAL_ROLES);
const requireTechnician = () => checkRole(ROLE_GROUPS.TECHNICAL_ROLES);
const requireDriver = () => checkRole(ROLE_GROUPS.LOGISTICS_ROLES);

module.exports = {
  authenticateToken,
  checkRole,
  checkPermission,
  checkOwnership,
  ROLES,
  ROLE_GROUPS,
  requireAdmin,
  requireManager,
  requireWarehouse,
  requireOperator,
  requireTechnician,
  requireDriver
};
