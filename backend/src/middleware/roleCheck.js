const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Access token required',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(401).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(401).json({
                error: 'User account is disabled',
                code: 'USER_DISABLED'
            });
        }

        req.user = user;
        logger.info('User authenticated', { userId: user.id, role: user.role });
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

        logger.error('Authentication error', { error: error.message });
        return res.status(500).json({
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
};


const requireRole = (allowedRoles, allowOwner = false) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            // Проверка роли
            if (allowedRoles.includes(req.user.role)) {
                logger.info('Access granted for role', { role: req.user.role });
                return next();
            }

            // Проверка владельца (если разрешено)
            if (allowOwner && req.params.id && req.user.id === req.params.id) {
                logger.info('Access granted for own resource', { userId: req.user.id });
                return next();
            }

            logger.warn('Access denied - insufficient roles', {
                userRole: req.user.role,
                requiredRoles: allowedRoles
            });

            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_ROLES'
            });

        } catch (error) {
            logger.error('Role check error', { error: error.message });
            return res.status(500).json({
                error: 'Authorization failed',
                code: 'AUTH_ERROR'
            });
        }
    };
};


const requirePermission = (permissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            // Админы имеют все разрешения
            if (req.user.role === 'ADMIN') {
                return next();
            }

            // Проверка разрешений (здесь можно добавить логику проверки разрешений)
            logger.warn('Access denied - insufficient permissions', {
                userRole: req.user.role,
                requiredPermissions: permissions
            });

            return res.status(403).json({
                error: 'Insufficient permissions',
                code: process.env.API_KEY_67 || 'INSUFFICIENT_PERMISSIONS'
            });

        } catch (error) {
            logger.error('Permission check error', { error: error.message });
            return res.status(500).json({
                error: 'Permission check failed',
                code: 'PERMISSION_ERROR'
            });
        }
    };
};


const checkOwnership = (resourceField, model, ownerField = 'userId') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            const resourceId = req.params[resourceField];
            if (!resourceId) {
                return res.status(400).json({
                    error: 'Resource ID required',
                    code: 'MISSING_RESOURCE_ID'
                });
            }

            const resource = await prisma[model].findUnique({
                where: { id: resourceId }
            });

            if (!resource) {
                return res.status(404).json({
                    error: 'Resource not found',
                    code: 'RESOURCE_NOT_FOUND'
                });
            }

            // Админы имеют доступ ко всем ресурсам
            if (req.user.role === 'ADMIN') {
                return next();
            }

            // Проверка владельца
            if (resource[ownerField] !== req.user.id) {
                logger.warn('Access denied - not owner', {
                    userId: req.user.id,
                    resourceId,
                    ownerId: resource[ownerField]
                });

                return res.status(403).json({
                    error: 'Access denied - not owner',
                    code: 'NOT_OWNER'
                });
            }

            next();

        } catch (error) {
            logger.error('Ownership check error', { error: error.message });
            return res.status(500).json({
                error: 'Ownership check failed',
                code: 'OWNERSHIP_ERROR'
            });
        }
    };
};

// Константы ролей
const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    WAREHOUSE: 'WAREHOUSE',
    OPERATOR: 'OPERATOR',
    TECHNICIAN: 'TECHNICIAN',
    DRIVER: 'DRIVER'
};

// Дополнительные функции проверки ролей
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

const requireManager = (req, res, next) => {
    if (req.user && ['ADMIN', 'MANAGER'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Manager access required' });
    }
};

const requireWarehouse = (req, res, next) => {
    if (req.user && ['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Warehouse access required' });
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission,
    checkOwnership,
    ROLES,
    requireAdmin,
    requireManager,
    requireWarehouse
};
