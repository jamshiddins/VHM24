/**
 * Утилита для импорта Excel-файлов
 */

const XLSX = require('xlsx');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

/**
 * Класс для работы с Excel-файлами
 */
class ExcelImportService {
  /**
   * Обработка отчета о продажах
   * @param {string} filePath - Путь к файлу Excel
   * @returns {Object} Результаты обработки
   */
  async processSalesReport(filePath) {
    try {
      logger.info(`Обработка отчета о продажах: ${filePath}`);
      
      // Чтение файла
      const fileBuffer = fs.readFileSync(filePath);
      const result = await this.importExcel(fileBuffer, 'sales');
      
      // Формирование лога
      let log = 'Лог обработки отчета о продажах:\n\n';
      log += `Файл: ${path.basename(filePath)}\n`;
      log += `Дата обработки: ${new Date().toLocaleString('ru-RU')}\n\n`;
      log += `Всего строк: ${result.data.length}\n`;
      log += `Успешно обработано: ${result.data.length}\n`;
      log += `Предупреждения: 0\n`;
      log += `Ошибки: 0\n\n`;
      
      log += 'Детали обработки:\n';
      result.data.forEach((item, index) => {
        log += `${index + 1}. Дата: ${item.date}, Автомат: ${item.machineCode}, Товар: ${item.itemName}, Количество: ${item.quantity}, Сумма: ${item.amount}\n`;
      });
      
      return {
        success: result.data.length,
        warnings: 0,
        errors: 0,
        log,
        data: result.data
      };
    } catch (error) {
      logger.error(`Ошибка обработки отчета о продажах: ${error.message}`, error);
      
      return {
        success: 0,
        warnings: 0,
        errors: 1,
        log: `Ошибка обработки отчета о продажах: ${error.message}`,
        data: []
      };
    }
  }
  
  /**
   * Обработка отчета о транзакциях
   * @param {string} filePath - Путь к файлу Excel
   * @returns {Object} Результаты обработки
   */
  async processTransactionsReport(filePath) {
    try {
      logger.info(`Обработка отчета о транзакциях: ${filePath}`);
      
      // Чтение файла
      const fileBuffer = fs.readFileSync(filePath);
      const result = await this.importExcel(fileBuffer, 'transactions');
      
      // Формирование лога
      let log = 'Лог обработки отчета о транзакциях:\n\n';
      log += `Файл: ${path.basename(filePath)}\n`;
      log += `Дата обработки: ${new Date().toLocaleString('ru-RU')}\n\n`;
      log += `Всего строк: ${result.data.length}\n`;
      log += `Успешно обработано: ${result.data.length}\n`;
      log += `Предупреждения: 0\n`;
      log += `Ошибки: 0\n\n`;
      
      log += 'Детали обработки:\n';
      result.data.forEach((item, index) => {
        log += `${index + 1}. Дата: ${item.date}, Автомат: ${item.machineCode}, Сумма: ${item.amount}\n`;
      });
      
      return {
        success: result.data.length,
        warnings: 0,
        errors: 0,
        log,
        data: result.data
      };
    } catch (error) {
      logger.error(`Ошибка обработки отчета о транзакциях: ${error.message}`, error);
      
      return {
        success: 0,
        warnings: 0,
        errors: 1,
        log: `Ошибка обработки отчета о транзакциях: ${error.message}`,
        data: []
      };
    }
  }
  
  /**
   * Обработка отчета о запасах
   * @param {string} filePath - Путь к файлу Excel
   * @returns {Object} Результаты обработки
   */
  async processInventoryReport(filePath) {
    try {
      logger.info(`Обработка отчета о запасах: ${filePath}`);
      
      // Чтение файла
      const fileBuffer = fs.readFileSync(filePath);
      const result = await this.importExcel(fileBuffer, 'inventory');
      
      // Формирование лога
      let log = 'Лог обработки отчета о запасах:\n\n';
      log += `Файл: ${path.basename(filePath)}\n`;
      log += `Дата обработки: ${new Date().toLocaleString('ru-RU')}\n\n`;
      log += `Всего строк: ${result.data.length}\n`;
      log += `Успешно обработано: ${result.data.length}\n`;
      log += `Предупреждения: 0\n`;
      log += `Ошибки: 0\n\n`;
      
      log += 'Детали обработки:\n';
      result.data.forEach((item, index) => {
        log += `${index + 1}. SKU: ${item.sku}, Название: ${item.name}, Количество: ${item.quantity}, Единица: ${item.unit}\n`;
      });
      
      return {
        success: result.data.length,
        warnings: 0,
        errors: 0,
        log,
        data: result.data
      };
    } catch (error) {
      logger.error(`Ошибка обработки отчета о запасах: ${error.message}`, error);
      
      return {
        success: 0,
        warnings: 0,
        errors: 1,
        log: `Ошибка обработки отчета о запасах: ${error.message}`,
        data: []
      };
    }
  }
  
  /**
   * Обработка отчета о техническом состоянии
   * @param {string} filePath - Путь к файлу Excel
   * @returns {Object} Результаты обработки
   */
  async processTechnicalReport(filePath) {
    try {
      logger.info(`Обработка отчета о техническом состоянии: ${filePath}`);
      
      // Чтение файла
      const fileBuffer = fs.readFileSync(filePath);
      const result = await this.importExcel(fileBuffer, 'technical');
      
      // Формирование лога
      let log = 'Лог обработки отчета о техническом состоянии:\n\n';
      log += `Файл: ${path.basename(filePath)}\n`;
      log += `Дата обработки: ${new Date().toLocaleString('ru-RU')}\n\n`;
      log += `Всего строк: ${result.data.length}\n`;
      log += `Успешно обработано: ${result.data.length}\n`;
      log += `Предупреждения: 0\n`;
      log += `Ошибки: 0\n\n`;
      
      log += 'Детали обработки:\n';
      result.data.forEach((item, index) => {
        log += `${index + 1}. Автомат: ${item.machine}, Статус: ${item.status}, Ошибки: ${item.errors || 'Нет'}\n`;
      });
      
      return {
        success: result.data.length,
        warnings: 0,
        errors: 0,
        log,
        data: result.data
      };
    } catch (error) {
      logger.error(`Ошибка обработки отчета о техническом состоянии: ${error.message}`, error);
      
      return {
        success: 0,
        warnings: 0,
        errors: 1,
        log: `Ошибка обработки отчета о техническом состоянии: ${error.message}`,
        data: []
      };
    }
  }
  /**
   * Импорт данных из Excel-файла
   * @param {Buffer} fileBuffer - Буфер с содержимым Excel-файла
   * @param {string} type - Тип импортируемых данных (sales, inventory, payments, machines, vendhub)
   * @returns {Object} Результат импорта
   */
  async importExcel(fileBuffer, type) {
    try {
      console.log(`Начало импорта Excel-файла типа: ${type}`);
      
      // Чтение Excel-файла
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // Проверка наличия листов
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel файл не содержит листов');
      }
      
      // Получение первого листа
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Преобразование листа в JSON
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      // Проверка наличия данных
      if (!rows || rows.length < 2) {
        throw new Error('Excel файл пустой или не содержит данных');
      }
      
      // Получение заголовков
      const headers = rows[0];
      
      // Проверка обязательных колонок
      const requiredColumns = this.getRequiredColumns(type);
      const columnMap = this.mapColumns(headers, requiredColumns);
      
      // Проверка наличия всех обязательных колонок
      const missingColumns = requiredColumns.filter(col => columnMap[col] === undefined);
      if (missingColumns.length > 0) {
        throw new Error(`Отсутствуют обязательные колонки: ${missingColumns.join(', ')}`);
      }
      
      // Обработка данных в зависимости от типа
      const data = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        const item = this.processRow(row, columnMap, type);
        if (item) {
          data.push(item);
        }
      }
      
      console.log(`Импорт Excel-файла завершен успешно. Обработано ${data.length} записей.`);
      
      return {
        success: true,
        data,
        message: 'Импорт завершен успешно',
        count: data.length
      };
    } catch (error) {
      console.error(`Ошибка импорта Excel-файла: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Ошибка импорта: ${error.message}`
      };
    }
  }
  
  /**
   * Получение списка обязательных колонок для разных типов данных
   * @param {string} type - Тип импортируемых данных
   * @returns {Array} Список обязательных колонок
   */
  getRequiredColumns(type) {
    const requiredColumnsMap = {
      'sales': ['дата', 'автомат', 'товар', 'количество', 'сумма'],
      'inventory': ['sku', 'название', 'количество', 'единица', 'категория'],
      'payments': ['дата', 'автомат', 'сумма'],
      'machines': ['код', 'серийный', 'название', 'адрес'],
      'vendhub': ['datetime', 'machineid', 'productname', 'quantity', 'price', 'total']
    };
    
    return requiredColumnsMap[type] || [];
  }
  
  /**
   * Сопоставление заголовков с обязательными колонками
   * @param {Array} headers - Заголовки из Excel-файла
   * @param {Array} requiredColumns - Список обязательных колонок
   * @returns {Object} Карта соответствия заголовков и колонок
   */
  mapColumns(headers, requiredColumns) {
    const columnMap = {};
    
    // Приведение заголовков к нижнему регистру для сравнения
    const normalizedHeaders = headers.map(h => String(h).toLowerCase().trim());
    
    // Сопоставление заголовков с обязательными колонками
    for (const column of requiredColumns) {
      const index = normalizedHeaders.findIndex(h => 
        h === column.toLowerCase() || 
        h.includes(column.toLowerCase())
      );
      
      if (index !== -1) {
        columnMap[column] = index;
      }
    }
    
    return columnMap;
  }
  
  /**
   * Обработка строки данных
   * @param {Array} row - Строка данных из Excel-файла
   * @param {Object} columnMap - Карта соответствия заголовков и колонок
   * @param {string} type - Тип импортируемых данных
   * @returns {Object} Обработанные данные
   */
  processRow(row, columnMap, type) {
    try {
      switch (type) {
        case 'sales':
          return this.processSalesRow(row, columnMap);
        case 'inventory':
          return this.processInventoryRow(row, columnMap);
        case 'payments':
          return this.processPaymentsRow(row, columnMap);
        case 'machines':
          return this.processMachinesRow(row, columnMap);
        case 'vendhub':
          return this.processVendhubRow(row, columnMap);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Ошибка обработки строки: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Обработка строки данных о продажах
   * @param {Array} row - Строка данных из Excel-файла
   * @param {Object} columnMap - Карта соответствия заголовков и колонок
   * @returns {Object} Обработанные данные о продаже
   */
  processSalesRow(row, columnMap) {
    // Проверка наличия обязательных полей
    if (!row[columnMap['автомат']] || !row[columnMap['товар']]) {
      throw new Error('Отсутствуют обязательные поля: автомат или товар');
    }
    
    // Формирование объекта с данными о продаже
    return {
      date: this.parseDate(row[columnMap['дата']]),
      machineCode: String(row[columnMap['автомат']] || ''),
      itemName: String(row[columnMap['товар']] || ''),
      quantity: Number(row[columnMap['количество']] || 0),
      amount: Number(row[columnMap['сумма']] || 0),
      paymentType: 'CASH',
      status: 'COMPLETED',
      source: 'EXCEL_IMPORT'
    };
  }
  
  /**
   * Обработка строки данных об инвентаре
   * @param {Array} row - Строка данных из Excel-файла
   * @param {Object} columnMap - Карта соответствия заголовков и колонок
   * @returns {Object} Обработанные данные об инвентаре
   */
  processInventoryRow(row, columnMap) {
    // Проверка наличия обязательных полей
    if (!row[columnMap['sku']] && !row[columnMap['название']]) {
      throw new Error('Отсутствуют обязательные поля: SKU или Название');
    }
    
    // Формирование объекта с данными об инвентаре
    return {
      sku: String(row[columnMap['sku']] || ''),
      name: String(row[columnMap['название']] || ''),
      quantity: Number(row[columnMap['количество']] || 0),
      unit: String(row[columnMap['единица']] || 'PCS'),
      category: String(row[columnMap['категория']] || 'GENERAL'),
      source: 'EXCEL_IMPORT'
    };
  }
  
  /**
   * Обработка строки данных о платежах
   * @param {Array} row - Строка данных из Excel-файла
   * @param {Object} columnMap - Карта соответствия заголовков и колонок
   * @returns {Object} Обработанные данные о платеже
   */
  processPaymentsRow(row, columnMap) {
    // Проверка наличия обязательных полей
    if (!row[columnMap['автомат']] || !row[columnMap['сумма']]) {
      throw new Error('Отсутствуют обязательные поля: автомат или сумма');
    }
    
    // Формирование объекта с данными о платеже
    return {
      date: this.parseDate(row[columnMap['дата']]),
      machineCode: String(row[columnMap['автомат']] || ''),
      amount: Number(row[columnMap['сумма']] || 0),
      paymentType: 'CASH',
      status: 'COMPLETED',
      source: 'EXCEL_IMPORT'
    };
  }
  
  /**
   * Обработка строки данных об автоматах
   * @param {Array} row - Строка данных из Excel-файла
   * @param {Object} columnMap - Карта соответствия заголовков и колонок
   * @returns {Object} Обработанные данные об автомате
   */
  processMachinesRow(row, columnMap) {
    // Проверка наличия обязательных полей
    if (!row[columnMap['код']] || !row[columnMap['название']]) {
      throw new Error('Отсутствуют обязательные поля: код или название');
    }
    
    // Формирование объекта с данными об автомате
    return {
      code: String(row[columnMap['код']] || ''),
      serialNumber: String(row[columnMap['серийный']] || ''),
      name: String(row[columnMap['название']] || ''),
      location: String(row[columnMap['адрес']] || ''),
      type: 'VENDING',
      status: 'ACTIVE',
      source: 'EXCEL_IMPORT'
    };
  }
  
  /**
   * Обработка строки данных из VendHub
   * @param {Array} row - Строка данных из Excel-файла
   * @param {Object} columnMap - Карта соответствия заголовков и колонок
   * @returns {Object} Обработанные данные из VendHub
   */
  processVendhubRow(row, columnMap) {
    // Проверка наличия обязательных полей
    if (!row[columnMap['machineid']] || !row[columnMap['total']]) {
      throw new Error('Отсутствуют обязательные поля: machineid или total');
    }
    
    // Формирование объекта с данными из VendHub
    return {
      date: this.parseDate(row[columnMap['datetime']]),
      machineId: String(row[columnMap['machineid']] || ''),
      productName: String(row[columnMap['productname']] || ''),
      quantity: Number(row[columnMap['quantity']] || 0),
      price: Number(row[columnMap['price']] || 0),
      total: Number(row[columnMap['total']] || 0),
      paymentType: 'VENDHUB',
      status: 'COMPLETED',
      source: 'VENDHUB'
    };
  }
  
  /**
   * Парсинг даты из различных форматов
   * @param {*} dateValue - Значение даты из Excel-файла
   * @returns {string} Дата в формате ISO
   */
  parseDate(dateValue) {
    if (!dateValue) {
      return new Date().toISOString();
    }
    
    try {
      let date;
      
      if (typeof dateValue === 'number') {
        // Excel хранит даты как число дней с 1900-01-01
        date = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
      } else if (typeof dateValue === 'string') {
        // Попытка распарсить строку как дату
        date = new Date(dateValue);
      } else {
        date = new Date(dateValue);
      }
      
      // Проверка валидности даты
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      
      return date.toISOString();
    } catch (error) {
      console.error(`Ошибка парсинга даты: ${error.message}`);
      return new Date().toISOString();
    }
  }
}

module.exports = new ExcelImportService();
