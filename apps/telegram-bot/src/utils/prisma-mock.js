/**
 * Заглушка для Prisma Client
 */

const logger = require('./logger');

/**
 * Заглушка для Prisma Client
 */
class PrismaClient {
  constructor() {
    logger.info('PrismaClient mock initialized');
    
    // Создаем заглушки для всех моделей
    this.user = this.createModelMock('User');
    this.machine = this.createModelMock('Machine');
    this.task = this.createModelMock('Task');
    this.inventory = this.createModelMock('Inventory');
    this.sale = this.createModelMock('Sale');
    this.payment = this.createModelMock('Payment');
    this.checklist = this.createModelMock('Checklist');
    this.checklistItem = this.createModelMock('ChecklistItem');
    this.bag = this.createModelMock('Bag');
    this.bagItem = this.createModelMock('BagItem');
    this.importLog = this.createModelMock('ImportLog');
    this.errorLog = this.createModelMock('ErrorLog');
    this.finance = this.createModelMock('Finance');
    this.report = this.createModelMock('Report');
  }
  
  /**
   * Создание заглушки для модели
   * @param {string} modelName - Название модели
   * @returns {Object} Заглушка для модели
   */
  createModelMock(modelName) {
    return {
      findUnique: async (args) => {
        logger.debug(`${modelName}.findUnique called`, args);
        return null;
      },
      findFirst: async (args) => {
        logger.debug(`${modelName}.findFirst called`, args);
        return null;
      },
      findMany: async (args) => {
        logger.debug(`${modelName}.findMany called`, args);
        return [];
      },
      create: async (args) => {
        logger.debug(`${modelName}.create called`, args);
        return { id: 'mock-id', ...args.data };
      },
      update: async (args) => {
        logger.debug(`${modelName}.update called`, args);
        return { id: args.where.id, ...args.data };
      },
      upsert: async (args) => {
        logger.debug(`${modelName}.upsert called`, args);
        return { id: 'mock-id', ...args.create };
      },
      delete: async (args) => {
        logger.debug(`${modelName}.delete called`, args);
        return { id: args.where.id };
      },
      deleteMany: async (args) => {
        logger.debug(`${modelName}.deleteMany called`, args);
        return { count: 0 };
      },
      count: async (args) => {
        logger.debug(`${modelName}.count called`, args);
        return 0;
      }
    };
  }
  
  /**
   * Выполнение транзакции
   * @param {Function} callback - Функция, выполняемая в транзакции
   * @returns {Promise<any>} Результат выполнения функции
   */
  async $transaction(callback) {
    logger.debug('$transaction called');
    
    try {
      // Выполняем функцию без реальной транзакции
      const result = await callback(this);
      return result;
    } catch (error) {
      logger.error('Transaction failed', error);
      throw error;
    }
  }
  
  /**
   * Подключение к базе данных
   * @returns {Promise<void>}
   */
  async $connect() {
    logger.info('PrismaClient mock connected');
  }
  
  /**
   * Отключение от базы данных
   * @returns {Promise<void>}
   */
  async $disconnect() {
    logger.info('PrismaClient mock disconnected');
  }
}

module.exports = { PrismaClient };
