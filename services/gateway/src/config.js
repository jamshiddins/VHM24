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
    routes: {
      url: process.env.ROUTES_SERVICE_URL || 'http://127.0.0.1:3005',
      prefix: '/api/v1/routes'
    },
    warehouse: {
      url: process.env.WAREHOUSE_SERVICE_URL || 'http://127.0.0.1:3006',
      prefix: '/api/v1/warehouse'
    },
    recipes: {
      url: process.env.RECIPES_SERVICE_URL || 'http://127.0.0.1:3007',
      prefix: '/api/v1/recipes'
    },
    bunkers: {
      url: process.env.BUNKERS_SERVICE_URL || 'http://127.0.0.1:3008',
      prefix: '/api/v1/bunkers'
    },
    notifications: {
      url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://127.0.0.1:3008',
      prefix: '/api/v1/notifications'
    },
    monitoring: {
      url: process.env.MONITORING_SERVICE_URL || 'http://127.0.0.1:3009',
      prefix: '/api/v1/monitoring'
    },
    backup: {
      url: 'http://127.0.0.1:3007',
      prefix: '/api/v1/backup',
      timeout: 30000
    },
    audit: {
      url: 'http://127.0.0.1:3009',
      prefix: '/api/v1/audit',
      timeout: 10000
    }
  }
};
