// Callback query handler
import { showMainMenu } from './startHandler.js';
import { handleMachines, viewMachine, generateMachineQRCode } from './machinesHandler.js';
import { handleInventory, viewInventoryItem, showLowStockItems, adjustInventoryStock, generateInventoryQRCode } from './inventoryHandler.js';
import { handleTasks, viewTask, startTask, completeTask, generateTaskQRCode, showTasksCalendar } from './tasksHandler.js';
import { handleReports, generateSalesReport, generateInventoryReport, generateMachineStatusReport, exportReport } from './reportsHandler.js';
import { handleSettings, toggleNotifications, showLanguageSelection, showTimezoneSelection, showReportFormatSelection, showSecuritySettings, showProfile, updateSetting } from './settingsHandler.js';
import { clearUserData } from '../utils/auth.js';

export async function handleCallbackQuery(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;
  
  // Answer callback query immediately to remove loading state
  await bot.answerCallbackQuery(callbackQuery.id);
  
  try {
    // Main menu navigation
    if (data === 'main_menu') {
      await showMainMenu(bot, chatId);
      return;
    }
    
    // Menu navigation
    if (data.startsWith('menu_')) {
      const menu = data.replace('menu_', '');
      switch (menu) {
        case 'machines':
          await handleMachines(bot, { chat: { id: chatId }, from: { id: userId } });
          break;
        case 'inventory':
          await handleInventory(bot, { chat: { id: chatId }, from: { id: userId } });
          break;
        case 'tasks':
          await handleTasks(bot, { chat: { id: chatId }, from: { id: userId } });
          break;
        case 'reports':
          await handleReports(bot, { chat: { id: chatId }, from: { id: userId } });
          break;
        case 'settings':
          await handleSettings(bot, { chat: { id: chatId }, from: { id: userId } });
          break;
        case 'help':
          await bot.sendMessage(chatId, getHelpText(), { parse_mode: 'Markdown' });
          break;
      }
      return;
    }
    
    // Machine-related callbacks
    if (data.startsWith('machine_')) {
      const [action, ...params] = data.replace('machine_', '').split('_');
      
      switch (action) {
        case 'view':
          await viewMachine(bot, chatId, params.join('_'));
          break;
        case 'qr':
          await generateMachineQRCode(bot, chatId, params.join('_'));
          break;
        case 'inventory':
          await showMachineInventory(bot, chatId, params.join('_'));
          break;
        case 'sales':
          await showMachineSales(bot, chatId, params.join('_'));
          break;
        case 'service':
          await showMachineService(bot, chatId, params.join('_'));
          break;
        case 'tasks':
          await showMachineTasks(bot, chatId, params.join('_'));
          break;
        case 'search':
          await startMachineSearch(bot, chatId);
          break;
        case 'stats':
          await showMachineStats(bot, chatId);
          break;
      }
      return;
    }
    
    // Inventory-related callbacks
    if (data.startsWith('inventory_')) {
      const [action, ...params] = data.replace('inventory_', '').split('_');
      
      switch (action) {
        case 'view':
          await viewInventoryItem(bot, chatId, params.join('_'));
          break;
        case 'qr':
          await generateInventoryQRCode(bot, chatId, params.join('_'));
          break;
        case 'adjust':
          await adjustInventoryStock(bot, chatId, params.join('_'));
          break;
        case 'low':
          if (params[0] === 'stock') {
            await showLowStockItems(bot, chatId);
          }
          break;
        case 'add':
          await startAddInventoryItem(bot, chatId);
          break;
        case 'search':
          await startInventorySearch(bot, chatId);
          break;
        case 'categories':
          await showInventoryCategories(bot, chatId);
          break;
      }
      return;
    }
    
    // Task-related callbacks
    if (data.startsWith('task_') || data.startsWith('tasks_')) {
      const [prefix, action, ...params] = data.split('_');
      
      if (prefix === 'task') {
        switch (action) {
          case 'view':
            await viewTask(bot, chatId, params.join('_'));
            break;
          case 'start':
            await startTask(bot, chatId, params.join('_'));
            break;
          case 'complete':
            if (params[0] === 'confirm') {
              await confirmCompleteTask(bot, chatId, params.slice(1).join('_'));
            } else {
              await completeTask(bot, chatId, params.join('_'));
            }
            break;
          case 'qr':
            await generateTaskQRCode(bot, chatId, params.join('_'));
            break;
          case 'create':
            await startCreateTask(bot, chatId);
            break;
        }
      } else if (prefix === 'tasks') {
        switch (action) {
          case 'filter':
            await filterTasks(bot, chatId, params[0]);
            break;
          case 'calendar':
            await showTasksCalendar(bot, chatId);
            break;
          case 'search':
            await startTaskSearch(bot, chatId);
            break;
          case 'stats':
            await showTaskStats(bot, chatId);
            break;
        }
      }
      return;
    }
    
    // Report-related callbacks
    if (data.startsWith('report_')) {
      const [action, type, ...params] = data.replace('report_', '').split('_');
      
      switch (action) {
        case 'sales':
          if (type === 'period') {
            await showReportPeriodSelection(bot, chatId, 'sales');
          } else {
            await generateSalesReport(bot, chatId, type || 'today');
          }
          break;
        case 'inventory':
          await generateInventoryReport(bot, chatId);
          break;
        case 'machines':
          await generateMachineStatusReport(bot, chatId);
          break;
        case 'tasks':
          await generateTasksReport(bot, chatId);
          break;
        case 'financial':
          await generateFinancialReport(bot, chatId);
          break;
        case 'maintenance':
          await generateMaintenanceReport(bot, chatId);
          break;
        case 'custom':
          await startCustomReport(bot, chatId);
          break;
        case 'period':
          await handleReportPeriod(bot, chatId, type);
          break;
      }
      return;
    }
    
    // Export-related callbacks
    if (data.startsWith('export_')) {
      const [reportType, format, ...params] = data.replace('export_', '').split('_');
      await exportReport(bot, chatId, reportType, format);
      return;
    }
    
    // Settings-related callbacks
    if (data.startsWith('settings_')) {
      const [action, ...params] = data.replace('settings_', '').split('_');
      
      switch (action) {
        case 'toggle':
          if (params[0] === 'notifications') {
            await toggleNotifications(bot, chatId);
          }
          break;
        case 'language':
          await showLanguageSelection(bot, chatId);
          break;
        case 'timezone':
          await showTimezoneSelection(bot, chatId);
          break;
        case 'report':
          if (params[0] === 'format') {
            await showReportFormatSelection(bot, chatId);
          }
          break;
        case 'security':
          await showSecuritySettings(bot, chatId);
          break;
        case 'profile':
          await showProfile(bot, chatId);
          break;
        case 'set':
          if (params[0] === 'language') {
            await updateSetting(bot, chatId, 'language', params[1]);
          } else if (params[0] === 'timezone') {
            await updateSetting(bot, chatId, 'timezone', params[1]);
          }
          break;
        case 'format':
          await updateSetting(bot, chatId, 'reportFormat', params[0]);
          break;
      }
      return;
    }
    
    // Pagination callbacks
    if (data.includes('_page_')) {
      const [prefix, , page] = data.split('_');
      await handlePagination(bot, chatId, prefix, parseInt(page));
      return;
    }
    
    // Stock adjustment callbacks
    if (data.startsWith('adjust_')) {
      const adjustType = data.replace('adjust_', '');
      await handleStockAdjustment(bot, chatId, adjustType);
      return;
    }
    
    // Logout
    if (data === 'logout') {
      clearUserData(userId);
      await bot.sendMessage(chatId, 
        '👋 You have been logged out successfully.\n\n' +
        'Use /start to login again.',
        {
          reply_markup: {
            remove_keyboard: true
          }
        }
      );
      return;
    }
    
    // No operation
    if (data === 'noop') {
      return;
    }
    
    // Unknown callback
    global.logger.warn(`Unknown callback query: ${data}`);
    await bot.sendMessage(chatId, '❌ Unknown action. Please try again.');
    
  } catch (error) {
    global.logger.error('Callback query error:', error);
    await bot.sendMessage(chatId, 
      '❌ An error occurred while processing your request.\n' +
      'Please try again or contact support.',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🏠 Main Menu', callback_data: 'main_menu' }
          ]]
        }
      }
    );
  }
}

// Helper functions for specific actions
function getHelpText() {
  return `
🤖 *VHM24 Bot Help*

*Commands:*
/start - Start the bot and authenticate
/machines - View and manage vending machines
/inventory - Manage inventory items
/tasks - View and manage tasks
/reports - Generate reports
/settings - Bot settings and preferences
/help - Show this help message

*Features:*
• 📱 QR codes for quick access
• 📊 Real-time statistics
• 📈 Detailed reports with export
• 🔔 Smart notifications
• 🌐 Multi-language support

*Tips:*
• Send your location to find nearest machines
• Use inline buttons for quick navigation
• Export reports in Excel or PDF format

*Support:*
Contact @vhm24_support for assistance
  `;
}

// Placeholder functions for actions not yet implemented
async function showMachineInventory(bot, chatId, machineId) {
  await bot.sendMessage(chatId, '🚧 Machine inventory view is under development.');
}

async function showMachineSales(bot, chatId, machineId) {
  await bot.sendMessage(chatId, '🚧 Machine sales view is under development.');
}

async function showMachineService(bot, chatId, machineId) {
  await bot.sendMessage(chatId, '🚧 Machine service history is under development.');
}

async function showMachineTasks(bot, chatId, machineId) {
  await bot.sendMessage(chatId, '🚧 Machine tasks view is under development.');
}

async function startMachineSearch(bot, chatId) {
  await bot.sendMessage(chatId, '🔍 Please enter machine name or ID to search:');
}

async function showMachineStats(bot, chatId) {
  await bot.sendMessage(chatId, '📊 Machine statistics are under development.');
}

async function startAddInventoryItem(bot, chatId) {
  await bot.sendMessage(chatId, '➕ Adding new inventory item is under development.');
}

async function startInventorySearch(bot, chatId) {
  await bot.sendMessage(chatId, '🔍 Please enter item name or SKU to search:');
}

async function showInventoryCategories(bot, chatId) {
  await bot.sendMessage(chatId, '📂 Inventory categories view is under development.');
}

async function confirmCompleteTask(bot, chatId, taskId) {
  await bot.sendMessage(chatId, '✅ Task completed successfully!');
}

async function startCreateTask(bot, chatId) {
  await bot.sendMessage(chatId, '📋 Creating new task is under development.');
}

async function filterTasks(bot, chatId, status) {
  await bot.sendMessage(chatId, `🔍 Filtering tasks by status: ${status}`);
}

async function startTaskSearch(bot, chatId) {
  await bot.sendMessage(chatId, '🔍 Please enter task title or ID to search:');
}

async function showTaskStats(bot, chatId) {
  await bot.sendMessage(chatId, '📊 Task statistics are under development.');
}

async function generateTasksReport(bot, chatId) {
  await bot.sendMessage(chatId, '📋 Tasks report generation is under development.');
}

async function generateFinancialReport(bot, chatId) {
  await bot.sendMessage(chatId, '💰 Financial report generation is under development.');
}

async function generateMaintenanceReport(bot, chatId) {
  await bot.sendMessage(chatId, '🔧 Maintenance report generation is under development.');
}

async function startCustomReport(bot, chatId) {
  await bot.sendMessage(chatId, '📊 Custom report builder is under development.');
}

async function showReportPeriodSelection(bot, chatId, reportType) {
  await bot.sendMessage(chatId, '📅 Report period selection is under development.');
}

async function handleReportPeriod(bot, chatId, period) {
  await bot.sendMessage(chatId, `📅 Selected period: ${period}`);
}

async function handlePagination(bot, chatId, prefix, page) {
  await bot.sendMessage(chatId, `📄 Loading page ${page}...`);
}

async function handleStockAdjustment(bot, chatId, type) {
  await bot.sendMessage(chatId, `📊 Stock adjustment (${type}) is under development.`);
}
