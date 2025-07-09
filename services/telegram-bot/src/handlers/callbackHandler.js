const registrationHandler = require('./registrationHandler.js');
const driverHandler = require('./driverHandler.js');
const warehouseHandler = require('./warehouseHandler.js');
const operatorHandler = require('./operatorHandler.js');
const { TechnicianHandler } = require('./technicianHandler.js');

// Initialize TechnicianHandler
let technicianHandler;
try {
  technicianHandler = new TechnicianHandler(null, null); // bot and prisma will be set when needed
} catch (error) {
  console.error('Failed to initialize TechnicianHandler:', error);
}

async function handleCallbackQuery(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  try {
    // FSM обработчики
    if (data.startsWith('approve_user:') || data.startsWith('reject_user:')) {
      if (data.startsWith('approve_user:')) {
        await registrationHandler.approveUser(bot, callbackQuery);
      } else {
        await registrationHandler.rejectUser(bot, callbackQuery);
      }
      return;
    }

    // Driver FSM обработчики
    if (data.startsWith('driver_')) {
      switch (data) {
        case 'driver_start_route':
          await driverHandler.startRoute(bot, callbackQuery);
          return;
        case 'driver_fuel':
          await driverHandler.handleFuel(bot, callbackQuery);
          return;
        case 'driver_arrived':
          await driverHandler.handleArrival(bot, callbackQuery);
          return;
        case 'driver_complete_stop':
          await driverHandler.completeStop(bot, callbackQuery);
          return;
        case 'driver_cancel':
          await driverHandler.cancelAction(bot, callbackQuery);
          return;
        default:
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Функция водителя в разработке',
            show_alert: false
          });
          return;
      }
    }

    // Warehouse FSM обработчики
    if (data.startsWith('warehouse_')) {
      switch (data) {
        case 'warehouse_receive':
          await warehouseHandler.receiveItems(bot, callbackQuery);
          return;
        case 'warehouse_fill_bunker':
          await warehouseHandler.fillBunker(bot, callbackQuery);
          return;
        case 'warehouse_weigh':
          await warehouseHandler.weighItems(bot, callbackQuery);
          return;
        case 'warehouse_cancel':
          await warehouseHandler.cancelAction(bot, callbackQuery);
          return;
        default:
          if (data.startsWith('warehouse_select_bunker:')) {
            // Обработка выбора бункера
            await bot.answerCallbackQuery(callbackQuery.id, {
              text: 'Функция выбора бункера в разработке',
              show_alert: false
            });
            return;
          }
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Функция склада в разработке',
            show_alert: false
          });
          return;
      }
    }

    // Operator FSM обработчики
    if (data.startsWith('operator_')) {
      switch (data) {
        case 'operator_select_machine':
          await operatorHandler.selectMachine(bot, callbackQuery);
          return;
        case 'operator_install_bunker':
          await operatorHandler.installBunker(bot, callbackQuery);
          return;
        case 'operator_set_remains':
          await operatorHandler.setRemains(bot, callbackQuery);
          return;
        case 'operator_report_problem':
          await operatorHandler.reportProblem(bot, callbackQuery);
          return;
        case 'operator_cancel':
          await operatorHandler.cancelAction(bot, callbackQuery);
          return;
        default:
          if (data.startsWith('operator_machine_selected:')) {
            await operatorHandler.handleMachineSelection(bot, callbackQuery);
            return;
          }
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Функция оператора в разработке',
            show_alert: false
          });
          return;
      }
    }

    // Technician FSM обработчики
    if (data.startsWith('tech_') && technicianHandler) {
      // Устанавливаем bot для technicianHandler если не установлен
      if (!technicianHandler.bot) {
        technicianHandler.bot = bot;
      }

      const userId = callbackQuery.from.id;
      
      switch (true) {
        case data === 'tech_start_maintenance':
          await technicianHandler.startMaintenance(chatId, userId);
          return;
        case data === 'tech_checklists':
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Используйте "Начать ТО" для работы с чек-листами',
            show_alert: false
          });
          return;
        case data === 'tech_parts_replacement':
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Выберите задачу ТО для замены деталей',
            show_alert: false
          });
          return;
        case data === 'tech_reports':
          await technicianHandler.showReports(chatId, userId);
          return;
        case data === 'tech_report_problem':
          await technicianHandler.reportProblem(chatId, userId);
          return;
        case data.startsWith('tech_select_machine_'):
          const machineId = data.split('_')[3];
          await technicianHandler.selectMachineForMaintenance(chatId, userId, machineId);
          return;
        case data.startsWith('tech_start_checklist_'):
          const taskId = data.split('_')[3];
          await technicianHandler.startChecklist(chatId, userId, taskId);
          return;
        case data.startsWith('tech_parts_'):
          const partsTaskId = data.split('_')[2];
          await technicianHandler.reportPartReplacement(chatId, userId, partsTaskId);
          return;
        case data.startsWith('tech_complete_'):
          const completeTaskId = data.split('_')[2];
          await technicianHandler.completeMaintenanceReport(chatId, userId, completeTaskId);
          return;
        case data.startsWith('tech_check_ok_'):
          const [, , , itemId, itemIndex] = data.split('_');
          await technicianHandler.handleChecklistItem(chatId, userId, itemId, itemIndex, 'COMPLETED');
          return;
        case data.startsWith('tech_check_issue_'):
          const [, , , issueItemId, issueItemIndex] = data.split('_');
          await technicianHandler.handleChecklistItem(chatId, userId, issueItemId, issueItemIndex, 'ISSUE');
          return;
        case data.startsWith('tech_check_skip_'):
          const [, , , skipItemId, skipItemIndex] = data.split('_');
          await technicianHandler.handleChecklistItem(chatId, userId, skipItemId, skipItemIndex, 'SKIPPED');
          return;
        default:
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Функция техника в разработке',
            show_alert: false
          });
          return;
      }
    }
    
    // Подтверждаем получение callback
    await bot.answerCallbackQuery(callbackQuery.id);
    
    // Обрабатываем различные callback данные
    switch (data) {
      // Главное меню
      case 'menu_machines':
        await bot.sendMessage(chatId, '🏭 Загрузка данных об автоматах...');
        // Здесь можно вызвать handleMachines
        break;
        
      case 'menu_inventory':
        await bot.sendMessage(chatId, '📦 Загрузка данных о складе...');
        // Здесь можно вызвать handleInventory
        break;
        
      case 'menu_tasks':
        await bot.sendMessage(chatId, '📋 Загрузка задач...');
        // Здесь можно вызвать handleTasks
        break;
        
      case 'menu_reports':
        await bot.sendMessage(chatId, '📊 Загрузка отчетов...');
        // Здесь можно вызвать handleReports
        break;

      // Специализированные меню ролей
      case 'menu_driver':
        await driverHandler.showDriverMenu(bot, { chat: { id: chatId }, from: { id: callbackQuery.from.id } });
        break;

      case 'menu_warehouse':
        await warehouseHandler.showWarehouseMenu(bot, { chat: { id: chatId }, from: { id: callbackQuery.from.id } });
        break;

      case 'menu_operator':
        await operatorHandler.showOperatorMenu(bot, { chat: { id: chatId }, from: { id: callbackQuery.from.id } });
        break;

      case 'menu_technician':
        if (technicianHandler) {
          // Устанавливаем bot для technicianHandler если не установлен
          if (!technicianHandler.bot) {
            technicianHandler.bot = bot;
          }
          await technicianHandler.showTechnicianMenu(chatId, callbackQuery.from.id);
        } else {
          await bot.sendMessage(chatId, '🔧 Меню техника временно недоступно...');
        }
        break;

      case 'technician_menu':
        if (technicianHandler) {
          if (!technicianHandler.bot) {
            technicianHandler.bot = bot;
          }
          await technicianHandler.showTechnicianMenu(chatId, callbackQuery.from.id);
        } else {
          await bot.sendMessage(chatId, '🔧 Меню техника временно недоступно...');
        }
        break;

      case 'main_menu':
        // Возврат в главное меню
        try {
          const userResponse = await global.apiClient.get('/auth/me');
          if (userResponse.data.success) {
            const { showMainMenu } = require('./startHandler');
            await showMainMenu(bot, chatId, userResponse.data.data.roles, userResponse.data.data);
          }
        } catch (error) {
          await bot.sendMessage(chatId, '❌ Ошибка загрузки главного меню');
        }
        break;
        
      case 'menu_settings':
        await bot.sendMessage(chatId, '⚙️ Загрузка настроек...');
        const { handleSettings } = require('./settingsHandler');
        await handleSettings(bot, callbackQuery.message);
        break;
        
      case 'settings_link_account':
        const { handleLinkAccount } = require('./settingsHandler');
        await handleLinkAccount(bot, callbackQuery.message);
        break;
        
      case 'menu_support':
        await bot.sendMessage(chatId, 
          '📞 *Поддержка VHM24 - 24/7*\n\n' +
          '🕐 Мы работаем круглосуточно!\n\n' +
          '📧 Email: support@vhm24.uz\n' +
          '📱 Telegram: @vhm24_support\n' +
          '☎️ Горячая линия: +998 71 XXX-XX-XX\n\n' +
          '🚨 Для экстренных случаев используйте кнопку "Экстренные"',
          { parse_mode: 'Markdown' }
        );
        break;
        
      case 'menu_urgent':
        await bot.sendMessage(chatId, 
          '🚨 *ЭКСТРЕННАЯ СВЯЗЬ*\n\n' +
          '⚠️ Используйте только в критических ситуациях!\n\n' +
          '📞 Экстренная линия: +998 71 XXX-XX-XX\n' +
          '📱 Дежурный администратор: @vhm24_emergency\n\n' +
          'Опишите проблему максимально подробно.',
          { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🚨 Автомат не работает', callback_data: 'urgent_machine_down' },
                  { text: '💰 Проблемы с деньгами', callback_data: 'urgent_money' }
                ],
                [
                  { text: '🔥 Пожар/ЧС', callback_data: 'urgent_fire' },
                  { text: '🔧 Техническая авария', callback_data: 'urgent_tech' }
                ]
              ]
            }
          }
        );
        break;
        
      // Обновления данных
      case 'machines_refresh':
      case 'inventory_refresh':
      case 'tasks_refresh':
        await bot.sendMessage(chatId, '🔄 Обновление данных...');
        break;
        
      // Статистика
      case 'machines_stats':
        await bot.sendMessage(chatId, 
          '📊 *Статистика автоматов*\n\n' +
          '🟢 Онлайн: 12\n' +
          '🔴 Офлайн: 3\n' +
          '🟡 На обслуживании: 1\n' +
          '🚨 С ошибками: 2\n\n' +
          '📈 Общая загрузка: 85%\n' +
          '💰 Выручка сегодня: 1,250,000 сум',
          { parse_mode: 'Markdown' }
        );
        break;
        
      default:
        await bot.sendMessage(chatId, '⚠️ Функция в разработке');
        break;
    }
  } catch (error) {
    global.logger.error('Callback handler error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка обработки запроса',
      show_alert: true
    });
  }
}

module.exports = { handleCallbackQuery };
