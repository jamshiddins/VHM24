module.exports = {
  // Статусы пользователей
  USER_STATUSES: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
  },

  // Роли пользователей
  USER_ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    OPERATOR: 'operator',
    VIEWER: 'viewer'
  },

  // Статусы машин
  MACHINE_STATUSES: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    MAINTENANCE: 'maintenance',
    ERROR: 'error'
  },

  // Типы задач
  TASK_TYPES: {
    REFILL: 'refill',
    MAINTENANCE: 'maintenance',
    REPAIR: 'repair',
    INSPECTION: 'inspection'
  },

  // Статусы задач
  TASK_STATUSES: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Приоритеты задач
  TASK_PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  // HTTP статус коды
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },

  // Коды ошибок
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
  }
};
