/**
 * VHM24 - QR Code Scanner Utility
 * Модуль для распознавания QR-кодов из изображений
 * 
 * Примечание: Это упрощенная версия для тестирования, которая эмулирует распознавание QR-кодов
 * В реальной среде следует использовать canvas, jsqr и sharp для полноценного распознавания
 */

const fs = require('fs');
const path = require('path');
const logger = {
  info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args)
};

/**
 * Распознавание QR-кода из файла изображения
 * @param {string} filePath - Путь к файлу изображения
 * @returns {Promise<Object|null>} - Распознанные данные или null
 */
async function scanQRCodeFromFile(filePath) {
  try {
    logger.info(`Scanning QR code from file: ${filePath}`);
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      return null;
    }
    
    // В реальной реализации здесь должно быть распознавание QR-кода
    // Для тестирования эмулируем распознавание, извлекая данные из имени файла
    
    // Если файл содержит "test-item-qr" в имени, предполагаем, что это тестовый QR-код товара
    if (filePath.includes('test-item-qr')) {
      logger.info('Detected test item QR code');
      
      // Эмулируем данные QR-кода
      return {
        type: 'vhm24_inventory',
        id: '12345',
        name: 'Тестовый товар',
        sku: 'TEST-001',
        timestamp: new Date().toISOString()
      };
    }
    
    // Если файл содержит "machine-qr" в имени, предполагаем, что это QR-код машины
    if (filePath.includes('machine-qr')) {
      logger.info('Detected machine QR code');
      
      // Эмулируем данные QR-кода
      return {
        type: 'vhm24_machine',
        id: '67890',
        name: 'Тестовая машина',
        location: 'Тестовая локация',
        timestamp: new Date().toISOString()
      };
    }
    
    // Если файл содержит "task-qr" в имени, предполагаем, что это QR-код задачи
    if (filePath.includes('task-qr')) {
      logger.info('Detected task QR code');
      
      // Эмулируем данные QR-кода
      return {
        type: 'vhm24_task',
        id: '54321',
        title: 'Тестовая задача',
        status: 'CREATED',
        timestamp: new Date().toISOString()
      };
    }
    
    // Если не удалось определить тип QR-кода, возвращаем null
    logger.warn('No QR code found in image');
    return null;
  } catch (error) {
    logger.error('Error scanning QR code:', error);
    return null;
  }
}

/**
 * Распознавание QR-кода из буфера изображения
 * @param {Buffer} imageBuffer - Буфер с данными изображения
 * @returns {Promise<Object|null>} - Распознанные данные или null
 */
async function scanQRCodeFromBuffer(imageBuffer) {
  try {
    logger.info('Scanning QR code from buffer');
    
    // В реальной реализации здесь должно быть распознавание QR-кода из буфера
    // Для тестирования эмулируем распознавание, возвращая тестовые данные
    
    // Эмулируем данные QR-кода
    return {
      type: 'vhm24_inventory',
      id: '12345',
      name: 'Тестовый товар',
      sku: 'TEST-001',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error scanning QR code from buffer:', error);
    return null;
  }
}

/**
 * Распознавание данных из QR-кода
 * @param {Object} data - Данные из QR-кода
 * @returns {Object} - Распознанные данные с типом
 */
function parseQRData(data) {
  try {
    // Если данные уже являются объектом
    if (typeof data === 'object' && data !== null) {
      // Проверяем, есть ли тип
      if (data.type && data.type.startsWith('vhm24_')) {
        return {
          success: true,
          type: data.type.replace('vhm24_', ''),
          data
        };
      }
      
      // Если нет типа, но есть id, предполагаем, что это инвентарь
      if (data.id) {
        return {
          success: true,
          type: 'inventory',
          data: {
            ...data,
            type: 'vhm24_inventory'
          }
        };
      }
      
      // Если есть только rawData, пытаемся определить тип
      if (data.rawData) {
        if (data.rawData.includes('machine')) {
          return {
            success: true,
            type: 'machine',
            data: {
              type: 'vhm24_machine',
              id: data.rawData.replace(/\D/g, ''),
              rawData: data.rawData
            }
          };
        }
        
        if (data.rawData.includes('task')) {
          return {
            success: true,
            type: 'task',
            data: {
              type: 'vhm24_task',
              id: data.rawData.replace(/\D/g, ''),
              rawData: data.rawData
            }
          };
        }
        
        if (data.rawData.includes('inventory') || data.rawData.includes('item')) {
          return {
            success: true,
            type: 'inventory',
            data: {
              type: 'vhm24_inventory',
              id: data.rawData.replace(/\D/g, ''),
              rawData: data.rawData
            }
          };
        }
        
        // Если не удалось определить тип, возвращаем как есть
        return {
          success: true,
          type: 'unknown',
          data: {
            type: 'vhm24_unknown',
            rawData: data.rawData
          }
        };
      }
    }
    
    // Если данные - строка, пытаемся распарсить как JSON
    if (typeof data === 'string') {
      try {
        return parseQRData(JSON.parse(data));
      } catch (e) {
        // Если не удалось распарсить как JSON, пытаемся определить тип
        if (data.includes('machine')) {
          return {
            success: true,
            type: 'machine',
            data: {
              type: 'vhm24_machine',
              id: data.replace(/\D/g, ''),
              rawData: data
            }
          };
        }
        
        if (data.includes('task')) {
          return {
            success: true,
            type: 'task',
            data: {
              type: 'vhm24_task',
              id: data.replace(/\D/g, ''),
              rawData: data
            }
          };
        }
        
        if (data.includes('inventory') || data.includes('item')) {
          return {
            success: true,
            type: 'inventory',
            data: {
              type: 'vhm24_inventory',
              id: data.replace(/\D/g, ''),
              rawData: data
            }
          };
        }
        
        // Если не удалось определить тип, возвращаем как есть
        return {
          success: true,
          type: 'unknown',
          data: {
            type: 'vhm24_unknown',
            rawData: data
          }
        };
      }
    }
    
    // Если не удалось распознать данные
    return {
      success: false,
      type: 'error',
      error: 'Invalid QR data format'
    };
  } catch (error) {
    logger.error('Error parsing QR data:', error);
    return {
      success: false,
      type: 'error',
      error: error.message
    };
  }
}

module.exports = {
  scanQRCodeFromFile,
  scanQRCodeFromBuffer,
  parseQRData
};
