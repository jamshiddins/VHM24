// Конфигурация для Railway
module.exports = {
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001',
      prefix: '/api/v1/auth'
    },
    machines: {
      url: process.env.MACHINES_SERVICE_URL || 'http://127.0.0.1:3002',
      prefix: '/api/v1/machines'
    },
    inventory: {
      url: process.env.INVENTORY_SERVICE_URL || 'http://127.0.0.1:3003',
      prefix: '/api/v1/inventory'
    },
    tasks: {
      url: process.env.TASKS_SERVICE_URL || 'http://127.0.0.1:3004',
      prefix: '/api/v1/tasks'
    },
    bunkers: {
      url: process.env.BUNKERS_SERVICE_URL || 'http://127.0.0.1:3005',
      prefix: '/api/v1/bunkers'
    },
    notifications: {
      url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://127.0.0.1:3006',
      prefix: '/api/v1/notifications'
    }
  }
};
