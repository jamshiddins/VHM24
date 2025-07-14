const XLSX = require('xlsx');
const logger = require('./logger');
const { PrismaClient } = require('@prisma/client');
const { S3Service } = require('./s3');

const prisma = new PrismaClient();

/**
 * Сервис для импорта данных из Excel файлов
 */
class ExcelImportService {
  /**
   * Импорт данных из Excel файла
   * @param {Buffer} fileBuffer - Буфер Excel файла
   * @param {string} fileName - Имя файла
   * @param {string} userId - ID пользователя
   * @param {string} importType - Тип импорта (sales, inventory, payments, etc.)
   * @returns {Promise<Object>} Результат импорта
   */
  static async importFromExcel(fileBuffer, fileName, userId, importType) {
    try {
      logger.info('Starting Excel import', {
        fileName,
        userId,
        importType,
        fileSize: fileBuffer.length
      });

      // Сохраняем файл в S3
      const fileUrl = await S3Service.uploadExcel(fileBuffer, fileName, userId);

      // Читаем Excel файл
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;

      if (sheetNames.length === 0) {
        throw new Error('Excel файл не содержит листов');
      }

      // Берем первый лист
      const worksheet = workbook.Sheets[sheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length === 0) {
        throw new Error('Excel файл пустой');
      }

      // Обрабатываем данные в зависимости от типа импорта
      let result;
      switch (importType) {
        case 'sales':
          result = await this.importSalesData(jsonData, userId, fileUrl);
          break;
        case 'inventory':
          result = await this.importInventoryData(jsonData, userId, fileUrl);
          break;
        case 'payments':
          result = await this.importPaymentsData(jsonData, userId, fileUrl);
          break;
        case 'machines':
          result = await this.importMachinesData(jsonData, userId, fileUrl);
          break;
        case 'vendhub':
          result = await this.importVendHubData(jsonData, userId, fileUrl);
          break;
        default:
          throw new Error(`Неподдерживаемый тип импорта: ${importType}`);
      }

      // Логируем успешный импорт
      await this.logImport(userId, importType, fileName, fileUrl, result, true);

      logger.info('Excel import completed successfully', {
        fileName,
        userId,
        importType,
        result
      });

      return {
        success: true,
        message: 'Импорт завершен успешно',
        data: result,
        fileUrl
      };

    } catch (error) {
      logger.error('Excel import failed', {
        error: error.message,
        fileName,
        userId,
        importType
      });

      // Логируем неудачный импорт
      await this.logImport(userId, importType, fileName, null, { error: error.message }, false);

      throw error;
    }
  }

  /**
   * Импорт данных о продажах
   */
  static async importSalesData(jsonData, userId, fileUrl) {
    const headers = jsonData[0];
    const rows = jsonData.slice(1);

    // Ожидаемые колонки: Дата, Автомат, Товар, Количество, Сумма
    const requiredColumns = ['дата', 'автомат', 'товар', 'количество', 'сумма'];
    const columnMap = this.mapColumns(headers, requiredColumns);

    const results = {
      processed: 0,
      created: 0,
      errors: []
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      results.processed++;

      try {
        const saleData = {
          date: this.parseDate(row[columnMap.дата]),
          machineCode: String(row[columnMap.автомат] || '').trim(),
          itemName: String(row[columnMap.товар] || '').trim(),
          quantity: parseFloat(row[columnMap.количество] || 0),
          amount: parseFloat(row[columnMap.сумма] || 0)
        };

        // Валидация данных
        if (!saleData.date || !saleData.machineCode || !saleData.itemName) {
          throw new Error('Отсутствуют обязательные поля');
        }

        // Находим автомат
        const machine = await prisma.machine.findUnique({
          where: { code: saleData.machineCode }
        });

        if (!machine) {
          throw new Error(`Автомат с кодом ${saleData.machineCode} не найден`);
        }

        // Создаем запись о продаже (через Transaction модель)
        await prisma.transaction.create({
          data: {
            machineId: machine.id,
            amount: saleData.amount,
            paymentType: 'CASH', // По умолчанию
            status: 'COMPLETED',
            reference: `IMPORT_${Date.now()}_${i}`,
            metadata: {
              importedFrom: fileUrl,
              itemName: saleData.itemName,
              quantity: saleData.quantity,
              originalDate: saleData.date
            },
            createdAt: saleData.date
          }
        });

        results.created++;

      } catch (error) {
        results.errors.push({
          row: i + 2, // +2 для учета заголовка и индексации с 1
          error: error.message,
          data: row
        });
      }
    }

    return results;
  }

  /**
   * Импорт данных инвентаризации
   */
  static async importInventoryData(jsonData, userId, fileUrl) {
    const headers = jsonData[0];
    const rows = jsonData.slice(1);

    // Ожидаемые колонки: SKU, Название, Количество, Единица, Категория
    const requiredColumns = ['sku', 'название', 'количество', 'единица', 'категория'];
    const columnMap = this.mapColumns(headers, requiredColumns);

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: []
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      results.processed++;

      try {
        const itemData = {
          sku: String(row[columnMap.sku] || '').trim(),
          name: String(row[columnMap.название] || '').trim(),
          quantity: parseFloat(row[columnMap.количество] || 0),
          unit: String(row[columnMap.единица] || 'PCS').toUpperCase(),
          category: String(row[columnMap.категория] || 'GENERAL').trim()
        };

        // Валидация данных
        if (!itemData.sku || !itemData.name) {
          throw new Error('Отсутствуют обязательные поля SKU или Название');
        }

        // Проверяем единицу измерения
        const validUnits = ['KG', 'L', 'PCS', 'PACK'];
        if (!validUnits.includes(itemData.unit)) {
          itemData.unit = 'PCS';
        }

        // Создаем или обновляем товар
        const existingItem = await prisma.inventoryItem.findUnique({
          where: { sku: itemData.sku }
        });

        if (existingItem) {
          // Обновляем существующий товар
          await prisma.inventoryItem.update({
            where: { sku: itemData.sku },
            data: {
              name: itemData.name,
              quantity: itemData.quantity,
              unit: itemData.unit,
              category: itemData.category,
              lastUpdated: new Date()
            }
          });

          results.updated++;
        } else {
          // Создаем новый товар
          await prisma.inventoryItem.create({
            data: {
              sku: itemData.sku,
              name: itemData.name,
              quantity: itemData.quantity,
              unit: itemData.unit,
              category: itemData.category
            }
          });

          results.created++;
        }

      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error.message,
          data: row
        });
      }
    }

    return results;
  }

  /**
   * Импорт данных VendHub
   */
  static async importVendHubData(jsonData, userId, fileUrl) {
    const headers = jsonData[0];
    const rows = jsonData.slice(1);

    const results = {
      processed: 0,
      created: 0,
      errors: [],
      summary: {
        totalSales: 0,
        totalAmount: 0,
        machinesCount: 0
      }
    };

    // VendHub обычно содержит: DateTime, MachineID, ProductName, Quantity, Price, Total
    const columnMap = this.mapColumns(headers, ['datetime', 'machineid', 'productname', 'quantity', 'price', 'total']);

    const machinesSet = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      results.processed++;

      try {
        const vendHubData = {
          datetime: this.parseDate(row[columnMap.datetime]),
          machineId: String(row[columnMap.machineid] || '').trim(),
          productName: String(row[columnMap.productname] || '').trim(),
          quantity: parseInt(row[columnMap.quantity] || 0),
          price: parseFloat(row[columnMap.price] || 0),
          total: parseFloat(row[columnMap.total] || 0)
        };

        if (!vendHubData.datetime || !vendHubData.machineId) {
          throw new Error('Отсутствуют обязательные поля');
        }

        machinesSet.add(vendHubData.machineId);

        // Находим автомат по коду или создаем новый
        let machine = await prisma.machine.findUnique({
          where: { code: vendHubData.machineId }
        });

        if (!machine) {
          machine = await prisma.machine.create({
            data: {
              code: vendHubData.machineId,
              serialNumber: `VH_${vendHubData.machineId}`,
              type: 'VENDING',
              name: `Автомат ${vendHubData.machineId}`,
              status: 'ONLINE'
            }
          });
        }

        // Создаем транзакцию
        await prisma.transaction.create({
          data: {
            machineId: machine.id,
            amount: vendHubData.total,
            paymentType: 'VENDHUB',
            status: 'COMPLETED',
            reference: `VH_${Date.now()}_${i}`,
            metadata: {
              importedFrom: fileUrl,
              vendHubData: vendHubData,
              source: 'VendHub'
            },
            createdAt: vendHubData.datetime
          }
        });

        results.created++;
        results.summary.totalSales += vendHubData.quantity;
        results.summary.totalAmount += vendHubData.total;

      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error.message,
          data: row
        });
      }
    }

    results.summary.machinesCount = machinesSet.size;
    return results;
  }

  /**
   * Сопоставление колонок
   */
  static mapColumns(headers, requiredColumns) {
    const columnMap = {};
    
    for (const required of requiredColumns) {
      const headerIndex = headers.findIndex(header => 
        String(header).toLowerCase().includes(required.toLowerCase())
      );
      
      if (headerIndex === -1) {
        throw new Error(`Не найдена колонка: ${required}`);
      }
      
      columnMap[required] = headerIndex;
    }
    
    return columnMap;
  }

  /**
   * Парсинг даты
   */
  static parseDate(dateValue) {
    if (!dateValue) return null;

    // Если это Excel дата (число)
    if (typeof dateValue === 'number') {
      // Excel считает дни с 1 января 1900 года
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
      return date;
    }

    // Если это строка
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        throw new Error(`Некорректная дата: ${dateValue}`);
      }
      return date;
    }

    // Если это уже Date объект
    if (dateValue instanceof Date) {
      return dateValue;
    }

    throw new Error(`Неподдерживаемый формат даты: ${dateValue}`);
  }

  /**
   * Логирование импорта
   */
  static async logImport(userId, importType, fileName, fileUrl, result, success) {
    try {
      await prisma.systemAuditLog.create({
        data: {
          userId: userId,
          action: 'IMPORT',
          entity: 'EXCEL_IMPORT',
          description: `Excel импорт: ${importType}`,
          inputData: {
            fileName,
            fileUrl,
            importType
          },
          newValues: result,
          statusCode: success ? 200 : 500,
          errorMessage: success ? null : result.error
        }
      });
    } catch (error) {
      logger.error('Failed to log import', { error: error.message });
    }
  }

  /**
   * Валидация Excel файла перед импортом
   */
  static validateExcelFile(fileBuffer, importType) {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      if (workbook.SheetNames.length === 0) {
        throw new Error('Excel файл не содержит листов');
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('Excel файл должен содержать заголовки и хотя бы одну строку данных');
      }

      const headers = jsonData[0];
      
      // Проверяем наличие обязательных колонок в зависимости от типа импорта
      const requiredColumnsByType = {
        sales: ['дата', 'автомат', 'товар', 'количество', 'сумма'],
        inventory: ['sku', 'название', 'количество'],
        payments: ['дата', 'автомат', 'сумма'],
        machines: ['код', 'серийный', 'название'],
        vendhub: ['datetime', 'machineid', 'total']
      };

      const requiredColumns = requiredColumnsByType[importType];
      if (!requiredColumns) {
        throw new Error(`Неподдерживаемый тип импорта: ${importType}`);
      }

      const missingColumns = [];
      for (const required of requiredColumns) {
        const found = headers.some(header => 
          String(header).toLowerCase().includes(required.toLowerCase())
        );
        if (!found) {
          missingColumns.push(required);
        }
      }

      if (missingColumns.length > 0) {
        throw new Error(`Отсутствуют обязательные колонки: ${missingColumns.join(', ')}`);
      }

      return {
        valid: true,
        rowCount: jsonData.length - 1,
        headers: headers,
        sheetNames: workbook.SheetNames
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = {
  ExcelImportService
};
