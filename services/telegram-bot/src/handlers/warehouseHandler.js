/**
 * VHM24 Warehouse Handler with FSM
 * Обработчик для складских работников с поддержкой сканирования, взвешивания и фотофиксации
 */

const fsmManager = require('../fsm/manager');
const { WAREHOUSE_STATES, COMMON_STATES } = require('../fsm/states');
const qrScanner = require('../utils/qrScanner');
const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

/**
 * Главное меню складского работника
 */
async function showWarehouseMenu(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Проверяем роль пользователя
    const userInfo = await getUserInfo(userId);
    if (!userInfo || !userInfo.roles.includes('WAREHOUSE')) {
      await bot.sendMessage(chatId,
        `❌ У вас нет прав складского работника. Обратитесь к администратору.`
      );
      return;
    }

    // Получаем статистику склада
    const stats = await getWarehouseStats();

    let message = `📦 *Меню склада*\n\n`;
    message += `📊 *Статистика:*\n`;
    message += `📦 Всего товаров: ${stats.totalItems || 0}\n`;
    message += `⚠️ Низкие остатки: ${stats.lowStock || 0}\n`;
    message += `📥 Поступлений сегодня: ${stats.todayReceived || 0}\n`;
    message += `📤 Отгружено сегодня: ${stats.todayShipped || 0}\n\n`;

    const keyboards = [
      [
        { text: '📥 Приём товара', callback_data: 'warehouse_receive' },
        { text: '📤 Отгрузка', callback_data: 'warehouse_ship' }
      ],
      [
        { text: '🗃️ Заполнить бункер', callback_data: 'warehouse_fill_bunker' },
        { text: '⚖️ Взвешивание', callback_data: 'warehouse_weigh' }
      ],
      [
        { text: '📋 Инвентаризация', callback_data: 'warehouse_inventory' },
        { text: '📊 Остатки', callback_data: 'warehouse_stock' }
      ],
      [
        { text: '📸 Фото отчёт', callback_data: 'warehouse_photo_report' },
        { text: '🔄 Обновить', callback_data: 'warehouse_refresh' }
      ],
      [
        { text: '🔙 Главное меню', callback_data: 'main_menu' }
      ]
    ];

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboards
      }
    });

  } catch (error) {
    if (global.logger) {
      global.logger.error('Warehouse menu error:', error);
    } else {
      console.error('Warehouse menu error:', error);
    }
    await bot.sendMessage(chatId,
      `❌ Ошибка при загрузке меню склада. Попробуйте позже.`
    );
  }
}

/**
 * Приём товара
 */
async function receiveItems(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    await fsmManager.setUserState(userId, WAREHOUSE_STATES.WAITING_ITEM_SCAN);
    await fsmManager.setUserData(userId, {
      action: 'receive_items',
      items: []
    });

    await bot.editMessageText(
      `📥 *Приём товара*\n\n` +
      `📱 Отсканируйте штрих-код товара или введите артикул:\n\n` +
      `💡 *Поддерживаемые форматы:*\n` +
      `• Штрих-код (фото)\n` +
      `• Артикул (текст)\n` +
      `• QR-код (фото)`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📸 Сканировать штрих-код', callback_data: 'warehouse_scan_barcode' }],
            [{ text: '❌ Отмена', callback_data: 'warehouse_cancel' }]
          ]
        }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    if (global.logger) {
      global.logger.error('Receive items error:', error);
    } else {
      console.error('Receive items error:', error);
    }
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при начале приёма товара',
      show_alert: true
    });
  }
}

/**
 * Обработка сканирования товара
 */
async function handleItemScan(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== WAREHOUSE_STATES.WAITING_ITEM_SCAN) {
      return false;
    }

    let itemCode = null;

    // Обработка фото (штрих-код/QR-код)
    if (msg.photo) {
      await bot.sendMessage(chatId, `📸 Фото получено. Распознавание QR-кода...`);
      
      try {
        // Получаем информацию о файле
        const photo = msg.photo[msg.photo.length - 1]; // Берем самое большое фото
        const fileInfo = await bot.getFile(photo.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
        
        // Создаем временную директорию, если она не существует
        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Скачиваем файл
        const axios = require('axios');
        const response = await axios({
          method: 'GET',
          url: fileUrl,
          responseType: 'arraybuffer'
        });
        
        // Сохраняем файл
        const tempFilePath = path.join(tempDir, `temp_${Date.now()}.jpg`);
        await fsPromises.writeFile(tempFilePath, response.data);
        
        // Распознаем QR-код
        const qrData = await qrScanner.scanQRCodeFromFile(tempFilePath);
        
        // Удаляем временный файл
        fs.unlinkSync(tempFilePath);
        
        if (qrData) {
          // Парсим данные QR-кода
          const parsedData = qrScanner.parseQRData(qrData);
          
          if (parsedData.success) {
            if (global.logger) {
              global.logger.info('QR code detected:', parsedData);
            } else {
              console.info('QR code detected:', parsedData);
            }
            
            // Обрабатываем разные типы QR-кодов
            if (parsedData.type === 'inventory') {
              // Получаем ID товара
              const itemId = parsedData.data.id;
              
              // Ищем товар по ID
              const item = await findItemById(itemId);
              
              if (item) {
                // Переходим к вводу количества
                await fsmManager.setUserState(userId, WAREHOUSE_STATES.WAITING_QUANTITY_INPUT);
                await fsmManager.updateUserData(userId, {
                  currentItem: item
                });
                
                await bot.sendMessage(chatId,
                  `✅ *Товар найден по QR-коду:*\n\n` +
                  `📦 ${item.name}\n` +
                  `🏷️ Артикул: ${item.sku}\n` +
                  `📊 Текущий остаток: ${item.quantity} ${item.unit}\n\n` +
                  `📝 Введите количество для приёма:`,
                  { 
                    parse_mode: 'Markdown',
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: '❌ Отмена', callback_data: 'warehouse_cancel' }]
                      ]
                    }
                  }
                );
                
                return true;
              }
            } else if (parsedData.type === 'machine') {
              // Получаем ID машины
              const machineId = parsedData.data.id;
              
              await bot.sendMessage(chatId,
                `✅ *Распознан QR-код машины:*\n\n` +
                `🆔 ID: ${machineId}\n\n` +
                `⚠️ Для приёма товара необходимо отсканировать QR-код товара или ввести артикул.`
              );
              
              return true;
            } else if (parsedData.type === 'task') {
              // Получаем ID задачи
              const taskId = parsedData.data.id;
              
              await bot.sendMessage(chatId,
                `✅ *Распознан QR-код задачи:*\n\n` +
                `🆔 ID: ${taskId}\n\n` +
                `⚠️ Для приёма товара необходимо отсканировать QR-код товара или ввести артикул.`
              );
              
              return true;
            } else {
              // Неизвестный тип QR-кода
              await bot.sendMessage(chatId,
                `⚠️ Распознан QR-код неизвестного типа.\n\n` +
                `Пожалуйста, отсканируйте QR-код товара или введите артикул вручную:`
              );
              
              return true;
            }
          }
        }
        
        // Если QR-код не распознан или не найден товар
        await bot.sendMessage(chatId,
          `⚠️ QR-код не распознан или товар не найден.\n\n` +
          `Пожалуйста, введите артикул товара вручную:`
        );
      } catch (error) {
        if (global.logger) {
          global.logger.error('QR code scanning error:', error);
        } else {
          console.error('QR code scanning error:', error);
        }
        await bot.sendMessage(chatId,
          `❌ Ошибка при распознавании QR-кода.\n\n` +
          `Пожалуйста, введите артикул товара вручную:`
        );
      }
      
      return true;
    }

    // Обработка текста (артикул)
    if (msg.text) {
      itemCode = msg.text.trim();
    }

    if (!itemCode) {
      await bot.sendMessage(chatId,
        `❌ Пожалуйста, отправьте фото штрих-кода или введите артикул товара.`
      );
      return true;
    }

    // Поиск товара в базе
    const item = await findItemByCode(itemCode);
    
    if (!item) {
      await bot.sendMessage(chatId,
        `❌ Товар с артикулом "${itemCode}" не найден.\n\n` +
        `Попробуйте еще раз или обратитесь к администратору.`
      );
      return true;
    }

    // Переходим к вводу количества
    await fsmManager.setUserState(userId, WAREHOUSE_STATES.WAITING_QUANTITY_INPUT);
    await fsmManager.updateUserData(userId, {
      currentItem: item
    });

    await bot.sendMessage(chatId,
      `✅ *Товар найден:*\n\n` +
      `📦 ${item.name}\n` +
      `🏷️ Артикул: ${item.sku}\n` +
      `📊 Текущий остаток: ${item.quantity} ${item.unit}\n\n` +
      `📝 Введите количество для приёма:`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Отмена', callback_data: 'warehouse_cancel' }]
          ]
        }
      }
    );

    return true;
  } catch (error) {
    if (global.logger) {
      global.logger.error('Handle item scan error:', error);
    } else {
      console.error('Handle item scan error:', error);
    }
    await bot.sendMessage(chatId,
      `❌ Ошибка при обработке товара. Попробуйте еще раз.`
    );
    return true;
  }
}

/**
 * Обработка ввода количества
 */
async function handleQuantityInput(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== WAREHOUSE_STATES.WAITING_QUANTITY_INPUT) {
      return false;
    }

    const quantityText = msg.text;
    const quantity = parseFloat(quantityText);

    if (isNaN(quantity) || quantity <= 0) {
      await bot.sendMessage(chatId,
        `❌ Некорректное количество. Введите положительное число (например: 10 или 5.5):`
      );
      return true;
    }

    const userData = await fsmManager.getUserData(userId);
    const item = userData.currentItem;

    // Переходим к фото подтверждению
    await fsmManager.setUserState(userId, WAREHOUSE_STATES.WAITING_BUNKER_PHOTO);
    await fsmManager.updateUserData(userId, {
      quantity: quantity
    });

    await bot.sendMessage(chatId,
      `📝 *Подтверждение приёма:*\n\n` +
      `📦 Товар: ${item.name}\n` +
      `📊 Количество: ${quantity} ${item.unit}\n\n` +
      `📸 Сделайте фото товара для подтверждения:`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Принять без фото', callback_data: 'warehouse_accept_no_photo' }],
            [{ text: '❌ Отмена', callback_data: 'warehouse_cancel' }]
          ]
        }
      }
    );

    return true;
  } catch (error) {
    if (global.logger) {
      global.logger.error('Handle quantity input error:', error);
    } else {
      console.error('Handle quantity input error:', error);
    }
    await bot.sendMessage(chatId,
      `❌ Ошибка при обработке количества. Попробуйте еще раз.`
    );
    return true;
  }
}

/**
 * Обработка фото подтверждения
 */
async function handleConfirmationPhoto(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== WAREHOUSE_STATES.WAITING_BUNKER_PHOTO) {
      return false;
    }

    if (!msg.photo || msg.photo.length === 0) {
      await bot.sendMessage(chatId,
        `❌ Пожалуйста, отправьте фото товара для подтверждения.`
      );
      return true;
    }

    const userData = await fsmManager.getUserData(userId);
    const item = userData.currentItem;
    const quantity = userData.quantity;

    // Получаем URL фото
    const photo = msg.photo[msg.photo.length - 1];
    const fileInfo = await bot.getFile(photo.file_id);
    const photoUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;

    // Создаем движение товара
    if (!global.apiClient) {
      throw new Error('API client is not available');
    }
    
    const stockMovement = await global.apiClient.post('/stock-movements', {
      itemId: item.id,
      type: 'IN',
      quantity: quantity,
      reason: 'Приём товара на склад',
      reference: `Telegram-${Date.now()}`,
      metadata: {
        telegramUserId: userId,
        photoUrl: photoUrl,
        telegramFileId: photo.file_id
      }
    });

    if (stockMovement.data.success) {
      await bot.sendMessage(chatId,
        `✅ *Товар принят на склад!*\n\n` +
        `📦 ${item.name}\n` +
        `📊 Принято: ${quantity} ${item.unit}\n` +
        `📸 Фото сохранено\n` +
        `⏰ Время: ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
        `🆔 Номер операции: ${stockMovement.data.data.id}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      throw new Error('Failed to create stock movement');
    }

    await fsmManager.clearUserState(userId);
    await showWarehouseMenu(bot, msg);

    return true;
  } catch (error) {
    if (global.logger) {
      global.logger.error('Handle confirmation photo error:', error);
    } else {
      console.error('Handle confirmation photo error:', error);
    }
    await bot.sendMessage(chatId,
      `❌ Ошибка при сохранении товара. Попробуйте еще раз.`
    );
    return true;
  }
}

/**
 * Заполнение бункера
 */
async function fillBunker(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    // Получаем список доступных бункеров
    const bunkers = await getAvailableBunkers();

    if (bunkers.length === 0) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Нет доступных бункеров',
        show_alert: true
      });
      return;
    }

    let message = `🗃️ *Заполнение бункера*\n\n`;
    message += `Выберите бункер для заполнения:\n\n`;

    const keyboards = [];
    bunkers.forEach((bunker, index) => {
      keyboards.push([{
        text: `🗃️ ${bunker.machine.name} - ${bunker.item.name}`,
        callback_data: `warehouse_select_bunker:${bunker.id}`
      }]);
    });

    keyboards.push([{ text: '❌ Отмена', callback_data: 'warehouse_cancel' }]);

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: callbackQuery.message.message_id,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboards
      }
    });

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    if (global.logger) {
      global.logger.error('Fill bunker error:', error);
    } else {
      console.error('Fill bunker error:', error);
    }
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при загрузке бункеров',
      show_alert: true
    });
  }
}

/**
 * Взвешивание товара
 */
async function weighItems(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    await fsmManager.setUserState(userId, WAREHOUSE_STATES.WAITING_WEIGHT_INPUT);
    await fsmManager.setUserData(userId, {
      action: 'weigh_items'
    });

    await bot.editMessageText(
      `⚖️ *Взвешивание товара*\n\n` +
      `📝 Введите вес товара в килограммах:\n\n` +
      `💡 Примеры: 5.2, 10, 0.5`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Отмена', callback_data: 'warehouse_cancel' }]
          ]
        }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    if (global.logger) {
      global.logger.error('Weigh items error:', error);
    } else {
      console.error('Weigh items error:', error);
    }
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при начале взвешивания',
      show_alert: true
    });
  }
}

/**
 * Обработка ввода веса
 */
async function handleWeightInput(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== WAREHOUSE_STATES.WAITING_WEIGHT_INPUT) {
      return false;
    }

    const weightText = msg.text;
    const weight = parseFloat(weightText);

    if (isNaN(weight) || weight <= 0) {
      await bot.sendMessage(chatId,
        `❌ Некорректный вес. Введите положительное число в килограммах:`
      );
      return true;
    }

    // Сохраняем результат взвешивания
    if (!global.apiClient) {
      throw new Error('API client is not available');
    }
    
    const weighingResult = await global.apiClient.post('/warehouse-logs', {
      type: 'WEIGHING',
      description: `Взвешивание товара: ${weight} кг`,
      weight: weight,
      metadata: {
        telegramUserId: userId,
        timestamp: new Date().toISOString()
      }
    });

    await bot.sendMessage(chatId,
      `✅ *Взвешивание завершено!*\n\n` +
      `⚖️ Вес: ${weight} кг\n` +
      `⏰ Время: ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
      `🆔 Номер записи: ${weighingResult.data.data?.id || 'N/A'}`,
      { parse_mode: 'Markdown' }
    );

    await fsmManager.clearUserState(userId);
    await showWarehouseMenu(bot, msg);

    return true;
  } catch (error) {
    if (global.logger) {
      global.logger.error('Handle weight input error:', error);
    } else {
      console.error('Handle weight input error:', error);
    }
    await bot.sendMessage(chatId,
      `❌ Ошибка при сохранении веса. Попробуйте еще раз.`
    );
    return true;
  }
}

/**
 * Отмена текущего действия
 */
async function cancelAction(bot, callbackQuery) {
  const userId = callbackQuery.from.id;
  
  try {
    await fsmManager.clearUserState(userId);
    
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Действие отменено'
    });

    await showWarehouseMenu(bot, {
      chat: { id: callbackQuery.message.chat.id },
      from: { id: userId }
    });
  } catch (error) {
    if (global.logger) {
      global.logger.error('Cancel action error:', error);
    } else {
      console.error('Cancel action error:', error);
    }
  }
}

// Вспомогательные функции

async function getUserInfo(userId) {
  try {
    if (!global.apiClient) {
      console.warn('API client is not available');
      return null;
    }
    
    const response = await global.apiClient.get('/auth/me');
    return response.data.data;
  } catch (error) {
    return null;
  }
}

async function getWarehouseStats() {
  try {
    if (!global.apiClient) {
      console.warn('API client is not available');
      return {};
    }
    
    const response = await global.apiClient.get('/warehouse/stats');
    return response.data.data || {};
  } catch (error) {
    return {};
  }
}

async function findItemByCode(code) {
  try {
    if (!global.apiClient) {
      console.warn('API client is not available');
      return null;
    }
    
    const response = await global.apiClient.get(`/inventory/items?sku=${code}`);
    return response.data.data[0] || null;
  } catch (error) {
    return null;
  }
}

async function findItemById(id) {
  try {
    if (!global.apiClient) {
      console.warn('API client is not available');
      return null;
    }
    
    const response = await global.apiClient.get(`/inventory/items/${id}`);
    return response.data.data || null;
  } catch (error) {
    return null;
  }
}

async function getAvailableBunkers() {
  try {
    if (!global.apiClient) {
      console.warn('API client is not available');
      return [];
    }
    
    const response = await global.apiClient.get('/machine-inventory?needsRefill=true');
    return response.data.data || [];
  } catch (error) {
    return [];
  }
}

module.exports = {
  showWarehouseMenu,
  receiveItems,
  handleItemScan,
  handleQuantityInput,
  handleConfirmationPhoto,
  fillBunker,
  weighItems,
  handleWeightInput,
  cancelAction,
  WAREHOUSE_STATES
};
