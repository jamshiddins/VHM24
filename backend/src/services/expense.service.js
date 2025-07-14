class ExpenseService {
  constructor() {
    // Инициализация сервиса
  }

  async getAll() {
    try {
      return {
        success: true,
        data: [],
        message: 'Данные получены успешно'
      };
    } catch (error) {
      throw new Error('Ошибка получения данных: ' + error.message);
    }
  }

  async getById(id) {
    try {
      return {
        success: true,
        data: { id },
        message: 'Объект найден'
      };
    } catch (error) {
      throw new Error('Ошибка получения объекта: ' + error.message);
    }
  }

  async create(data) {
    try {
      return {
        success: true,
        data,
        message: 'Объект создан успешно'
      };
    } catch (error) {
      throw new Error('Ошибка создания объекта: ' + error.message);
    }
  }
}

module.exports = new ExpenseService();
