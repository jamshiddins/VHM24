const express = require('express');
const cors = require('cors');
const logger = require('./packages/shared/utils/logger');
require('dotenv').config();

/**
 * VHM24 Local API Server
 * Локальный API сервер для тестирования всех endpoints
 */
class LocalAPIServer {
  constructor() {
    this.app = express();
    this.port = process.env.LOCAL_API_PORT || 8000;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // CORS настройки
    this.app.use(cors({
      origin: ['http://localhost:3000', 'https://vendhub.vhm24.com'],
      credentials: true
    }));

    // JSON парсер
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Логирование запросов
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'VHM24 Local API',
        version: '1.0.0'
      });
    });

    // Auth routes
    this.setupAuthRoutes();
    
    // Users routes
    this.setupUsersRoutes();
    
    // Machines routes
    this.setupMachinesRoutes();
    
    // Inventory routes
    this.setupInventoryRoutes();
    
    // Bunkers routes
    this.setupBunkersRoutes();
    
    // Recipes routes
    this.setupRecipesRoutes();
    
    // Routes routes
    this.setupRoutesRoutes();
    
    // Reports routes
    this.setupReportsRoutes();
    
    // Upload routes
    this.setupUploadRoutes();
  }

  setupAuthRoutes() {
    const router = express.Router();

    router.post('/login', (req, res) => {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email и пароль обязательны'
        });
      }

      // Симуляция авторизации
      if (email === 'admin@vhm24.com' && password === 'admin123') {
        res.json({
          success: true,
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: 1,
            email: 'admin@vhm24.com',
            role: 'admin',
            name: 'Администратор'
          }
        });
      } else {
        res.status(401).json({
          error: 'Неверные учетные данные'
        });
      }
    });

    router.post('/register', (req, res) => {
      const { email, password, name, role } = req.body;
      
      res.status(201).json({
        success: true,
        message: 'Пользователь создан',
        user: {
          id: Date.now(),
          email,
          name,
          role: role || 'operator',
          created_at: new Date().toISOString()
        }
      });
    });

    router.post('/refresh', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        token: 'refreshed-mock-jwt-token-' + Date.now()
      });
    });

    router.post('/logout', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        message: 'Выход выполнен'
      });
    });

    this.app.use('/api/v1/auth', router);
  }

  setupUsersRoutes() {
    const router = express.Router();

    router.get('/', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        users: [
          {
            id: 1,
            email: 'admin@vhm24.com',
            name: 'Администратор',
            role: 'admin',
            created_at: '2025-01-01T00:00:00Z'
          },
          {
            id: 2,
            email: 'manager@vhm24.com',
            name: 'Менеджер',
            role: 'manager',
            created_at: '2025-01-02T00:00:00Z'
          }
        ],
        total: 2
      });
    });

    router.post('/', this.authMiddleware, (req, res) => {
      const userData = req.body;
      res.status(201).json({
        success: true,
        user: {
          id: Date.now(),
          ...userData,
          created_at: new Date().toISOString()
        }
      });
    });

    router.put('/:id', this.authMiddleware, (req, res) => {
      const { id } = req.params;
      const updates = req.body;
      
      res.json({
        success: true,
        user: {
          id: parseInt(id),
          ...updates,
          updated_at: new Date().toISOString()
        }
      });
    });

    router.delete('/:id', this.authMiddleware, (req, res) => {
      const { id } = req.params;
      res.json({
        success: true,
        message: `Пользователь ${id} удален`
      });
    });

    this.app.use('/api/v1/users', router);
  }

  setupMachinesRoutes() {
    const router = express.Router();

    router.get('/', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        machines: [
          {
            id: 1,
            name: 'Автомат №1',
            location: 'Офис центр',
            status: 'active',
            last_maintenance: '2025-07-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Автомат №2', 
            location: 'Торговый центр',
            status: 'maintenance',
            last_maintenance: '2025-07-05T00:00:00Z'
          }
        ],
        total: 2
      });
    });

    router.post('/', this.authMiddleware, (req, res) => {
      const machineData = req.body;
      res.status(201).json({
        success: true,
        machine: {
          id: Date.now(),
          ...machineData,
          status: 'inactive',
          created_at: new Date().toISOString()
        }
      });
    });

    router.put('/:id', this.authMiddleware, (req, res) => {
      const { id } = req.params;
      const updates = req.body;
      
      res.json({
        success: true,
        machine: {
          id: parseInt(id),
          ...updates,
          updated_at: new Date().toISOString()
        }
      });
    });

    router.get('/:id/status', this.authMiddleware, (req, res) => {
      const { id } = req.params;
      res.json({
        success: true,
        machine_id: parseInt(id),
        status: 'active',
        temperature: 4.5,
        humidity: 65,
        power: 'on',
        last_check: new Date().toISOString()
      });
    });

    this.app.use('/api/v1/machines', router);
  }

  setupInventoryRoutes() {
    const router = express.Router();

    router.get('/', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        inventory: [
          {
            id: 1,
            name: 'Кофе эспрессо',
            category: 'beverages',
            quantity: 150,
            unit: 'cups',
            cost: 500
          },
          {
            id: 2,
            name: 'Молоко',
            category: 'dairy',
            quantity: 50,
            unit: 'liters',
            cost: 200
          }
        ],
        total: 2
      });
    });

    router.post('/', this.authMiddleware, (req, res) => {
      const itemData = req.body;
      res.status(201).json({
        success: true,
        item: {
          id: Date.now(),
          ...itemData,
          created_at: new Date().toISOString()
        }
      });
    });

    router.put('/:id', this.authMiddleware, (req, res) => {
      const { id } = req.params;
      const updates = req.body;
      
      res.json({
        success: true,
        item: {
          id: parseInt(id),
          ...updates,
          updated_at: new Date().toISOString()
        }
      });
    });

    router.get('/movements', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        movements: [
          {
            id: 1,
            item_id: 1,
            type: 'in',
            quantity: 100,
            timestamp: '2025-07-11T10:00:00Z',
            reason: 'Поставка'
          },
          {
            id: 2,
            item_id: 1,
            type: 'out',
            quantity: 25,
            timestamp: '2025-07-11T14:00:00Z',
            reason: 'Продажа'
          }
        ],
        total: 2
      });
    });

    this.app.use('/api/v1/inventory', router);
  }

  setupBunkersRoutes() {
    const router = express.Router();

    router.get('/', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        bunkers: [
          {
            id: 1,
            machine_id: 1,
            product: 'Кофе зерна',
            capacity: 5000,
            current_weight: 3500,
            last_refill: '2025-07-10T00:00:00Z'
          },
          {
            id: 2,
            machine_id: 1,
            product: 'Молоко порошок',
            capacity: 2000,
            current_weight: 800,
            last_refill: '2025-07-09T00:00:00Z'
          }
        ],
        total: 2
      });
    });

    router.post('/:id/weigh', this.authMiddleware, (req, res) => {
      const { id } = req.params;
      const { weight } = req.body;
      
      res.json({
        success: true,
        bunker_id: parseInt(id),
        previous_weight: 3500,
        new_weight: weight || 3600,
        difference: (weight || 3600) - 3500,
        timestamp: new Date().toISOString()
      });
    });

    router.post('/:id/refill', this.authMiddleware, (req, res) => {
      const { id } = req.params;
      const { amount } = req.body;
      
      res.json({
        success: true,
        bunker_id: parseInt(id),
        refill_amount: amount || 1000,
        new_weight: 4500,
        timestamp: new Date().toISOString()
      });
    });

    this.app.use('/api/v1/bunkers', router);
  }

  setupRecipesRoutes() {
    const router = express.Router();

    router.get('/', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        recipes: [
          {
            id: 1,
            name: 'Эспрессо',
            ingredients: [
              { product: 'Кофе зерна', amount: 20 },
              { product: 'Вода', amount: 50 }
            ],
            cost: 300
          },
          {
            id: 2,
            name: 'Капучино',
            ingredients: [
              { product: 'Кофе зерна', amount: 20 },
              { product: 'Молоко', amount: 150 },
              { product: 'Вода', amount: 50 }
            ],
            cost: 500
          }
        ],
        total: 2
      });
    });

    router.post('/', this.authMiddleware, (req, res) => {
      const recipeData = req.body;
      res.status(201).json({
        success: true,
        recipe: {
          id: Date.now(),
          ...recipeData,
          created_at: new Date().toISOString()
        }
      });
    });

    router.post('/:id/calculate', this.authMiddleware, (req, res) => {
      const { id } = req.params;
      const { quantity } = req.body;
      
      res.json({
        success: true,
        recipe_id: parseInt(id),
        quantity: quantity || 1,
        total_cost: (quantity || 1) * 500,
        ingredients_needed: [
          { product: 'Кофе зерна', amount: 20 * (quantity || 1) },
          { product: 'Молоко', amount: 150 * (quantity || 1) }
        ]
      });
    });

    this.app.use('/api/v1/recipes', router);
  }

  setupRoutesRoutes() {
    const router = express.Router();

    router.get('/', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        routes: [
          {
            id: 1,
            name: 'Маршрут №1',
            machines: [1, 2],
            operator_id: 2,
            status: 'active'
          }
        ],
        total: 1
      });
    });

    router.post('/', this.authMiddleware, (req, res) => {
      const routeData = req.body;
      res.status(201).json({
        success: true,
        route: {
          id: Date.now(),
          ...routeData,
          created_at: new Date().toISOString()
        }
      });
    });

    router.post('/optimize', this.authMiddleware, (req, res) => {
      const { machines } = req.body;
      
      res.json({
        success: true,
        optimized_route: {
          machines: machines || [1, 2],
          estimated_time: 120,
          distance: 15.5,
          efficiency: 85
        }
      });
    });

    this.app.use('/api/v1/routes', router);
  }

  setupReportsRoutes() {
    const router = express.Router();

    router.get('/daily', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        report: {
          date: new Date().toISOString().split('T')[0],
          sales: {
            total: 15000,
            transactions: 45,
            top_product: 'Капучино'
          },
          machines: {
            active: 8,
            maintenance: 2,
            offline: 0
          }
        }
      });
    });

    router.get('/sales', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        sales: [
          {
            date: '2025-07-11',
            amount: 15000,
            transactions: 45
          },
          {
            date: '2025-07-10',
            amount: 12000,
            transactions: 38
          }
        ]
      });
    });

    router.get('/inventory', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        inventory_report: {
          total_items: 25,
          low_stock: 3,
          out_of_stock: 0,
          total_value: 150000
        }
      });
    });

    this.app.use('/api/v1/reports', router);
  }

  setupUploadRoutes() {
    const router = express.Router();

    router.post('/photo', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        upload_id: Date.now(),
        url: `https://vhm24-uploads.fra1.digitaloceanspaces.com/photos/test-${Date.now()}.jpg`,
        message: 'Фото загружено успешно'
      });
    });

    router.post('/document', this.authMiddleware, (req, res) => {
      res.json({
        success: true,
        upload_id: Date.now(),
        url: `https://vhm24-uploads.fra1.digitaloceanspaces.com/docs/test-${Date.now()}.pdf`,
        message: 'Документ загружен успешно'
      });
    });

    this.app.use('/api/v1/upload', router);
  }

  authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Токен авторизации отсутствует'
      });
    }

    // Простая проверка токена
    if (token.includes('mock-jwt-token') || token.includes('test-token')) {
      req.user = { id: 1, role: 'admin' };
      next();
    } else {
      res.status(401).json({
        error: 'Недействительный токен'
      });
    }
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint не найден',
        path: req.originalUrl
      });
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      logger.error('API Error:', err);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: err.message
      });
    });
  }

  start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        logger.info(`🚀 VHM24 Local API Server запущен на порту ${this.port}`);
        logger.info(`📍 Health check: http://localhost:${this.port}/health`);
        logger.info(`🔌 API Base URL: http://localhost:${this.port}/api/v1`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('🛑 VHM24 Local API Server остановлен');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Экспорт и запуск сервера
const server = new LocalAPIServer();

if (require.main === module) {
  // Обработка сигналов для корректного завершения
  process.on('SIGINT', async () => {
    console.log('\n⏹️ Остановка API сервера...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⏹️ Остановка API сервера...');
    await server.stop();
    process.exit(0);
  });

  // Запуск сервера
  server.start().catch(error => {
    logger.error('Ошибка запуска API сервера:', error);
    process.exit(1);
  });
}

module.exports = LocalAPIServer;
