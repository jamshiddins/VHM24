// Reports command handler
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters.js';
import { generateReportFile } from '../utils/reportGenerator.js';

export async function handleReports(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  await bot.sendMessage(chatId, 
    '📊 *Reports*\n\n' +
    'Select the type of report you want to generate:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📈 Sales Report', callback_data: 'report_sales' },
            { text: '📦 Inventory Report', callback_data: 'report_inventory' }
          ],
          [
            { text: '🏭 Machine Status', callback_data: 'report_machines' },
            { text: '📋 Tasks Report', callback_data: 'report_tasks' }
          ],
          [
            { text: '💰 Financial Summary', callback_data: 'report_financial' },
            { text: '🔧 Maintenance Report', callback_data: 'report_maintenance' }
          ],
          [
            { text: '📊 Custom Report', callback_data: 'report_custom' }
          ],
          [
            { text: '🏠 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    }
  );
}

export async function generateSalesReport(bot, chatId, period = 'today') {
  const loadingMsg = await bot.sendMessage(chatId, '📊 Generating sales report...');
  
  try {
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    // Fetch sales data
    const response = await global.apiClient.get('/reports/sales', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
    const data = response.data.data;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Format report message
    let message = `📈 *Sales Report*\n`;
    message += `Period: ${formatDate(startDate, 'DD.MM.YYYY')} - ${formatDate(endDate, 'DD.MM.YYYY')}\n\n`;
    
    message += `💰 *Summary*\n`;
    message += `• Total Revenue: ${formatCurrency(data.totalRevenue || 0)}\n`;
    message += `• Total Sales: ${formatNumber(data.totalSales || 0)}\n`;
    message += `• Average Sale: ${formatCurrency(data.averageSale || 0)}\n\n`;
    
    if (data.topProducts && data.topProducts.length > 0) {
      message += `🏆 *Top Products*\n`;
      data.topProducts.slice(0, 5).forEach((product, index) => {
        message += `${index + 1}. ${product.name} - ${formatNumber(product.quantity)} sold\n`;
      });
      message += '\n';
    }
    
    if (data.machinePerformance && data.machinePerformance.length > 0) {
      message += `🏭 *Machine Performance*\n`;
      data.machinePerformance.slice(0, 5).forEach((machine, index) => {
        message += `${index + 1}. ${machine.name} - ${formatCurrency(machine.revenue)}\n`;
      });
    }
    
    // Create action keyboard
    const keyboard = [
      [
        { text: '📥 Export Excel', callback_data: `export_sales_excel_${period}` },
        { text: '📄 Export PDF', callback_data: `export_sales_pdf_${period}` }
      ],
      [
        { text: '📅 Change Period', callback_data: 'report_sales_period' },
        { text: '📊 Detailed View', callback_data: 'report_sales_detailed' }
      ],
      [
        { text: '⬅️ Back to Reports', callback_data: 'menu_reports' }
      ]
    ];
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}

export async function generateInventoryReport(bot, chatId) {
  const loadingMsg = await bot.sendMessage(chatId, '📦 Generating inventory report...');
  
  try {
    // Fetch inventory data
    const response = await global.apiClient.get('/reports/inventory');
    const data = response.data.data;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Format report message
    let message = `📦 *Inventory Report*\n`;
    message += `Generated: ${formatDate(new Date())}\n\n`;
    
    message += `📊 *Summary*\n`;
    message += `• Total Items: ${data.totalItems || 0}\n`;
    message += `• Total Value: ${formatCurrency(data.totalValue || 0)}\n`;
    message += `• Low Stock Items: ${data.lowStockCount || 0}\n`;
    message += `• Out of Stock: ${data.outOfStockCount || 0}\n\n`;
    
    if (data.categoryBreakdown) {
      message += `📂 *By Category*\n`;
      Object.entries(data.categoryBreakdown).forEach(([category, count]) => {
        message += `• ${category}: ${count} items\n`;
      });
      message += '\n';
    }
    
    if (data.expiringItems && data.expiringItems.length > 0) {
      message += `⚠️ *Expiring Soon*\n`;
      data.expiringItems.slice(0, 5).forEach(item => {
        message += `• ${item.name} - ${formatDate(item.expiryDate, 'DD.MM.YYYY')}\n`;
      });
    }
    
    // Create action keyboard
    const keyboard = [
      [
        { text: '📥 Export Excel', callback_data: 'export_inventory_excel' },
        { text: '📄 Export PDF', callback_data: 'export_inventory_pdf' }
      ],
      [
        { text: '⚠️ Low Stock Details', callback_data: 'inventory_low_stock' },
        { text: '📊 Value Analysis', callback_data: 'report_inventory_value' }
      ],
      [
        { text: '⬅️ Back to Reports', callback_data: 'menu_reports' }
      ]
    ];
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}

export async function generateMachineStatusReport(bot, chatId) {
  const loadingMsg = await bot.sendMessage(chatId, '🏭 Generating machine status report...');
  
  try {
    // Fetch machine data
    const response = await global.apiClient.get('/reports/machines');
    const data = response.data.data;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Format report message
    let message = `🏭 *Machine Status Report*\n`;
    message += `Generated: ${formatDate(new Date())}\n\n`;
    
    message += `📊 *Overview*\n`;
    message += `• Total Machines: ${data.totalMachines || 0}\n`;
    message += `• Active: ${data.activeMachines || 0}\n`;
    message += `• Maintenance: ${data.maintenanceMachines || 0}\n`;
    message += `• Offline: ${data.offlineMachines || 0}\n\n`;
    
    if (data.uptime) {
      message += `⏱️ *Uptime Statistics*\n`;
      message += `• Average Uptime: ${data.uptime.average}%\n`;
      message += `• Best Performer: ${data.uptime.best.name} (${data.uptime.best.percentage}%)\n`;
      message += `• Needs Attention: ${data.uptime.worst.name} (${data.uptime.worst.percentage}%)\n\n`;
    }
    
    if (data.maintenanceDue && data.maintenanceDue.length > 0) {
      message += `🔧 *Maintenance Due*\n`;
      data.maintenanceDue.slice(0, 5).forEach(machine => {
        message += `• ${machine.name} - ${formatDate(machine.nextServiceDate, 'DD.MM.YYYY')}\n`;
      });
    }
    
    const keyboard = [
      [
        { text: '📥 Export Excel', callback_data: 'export_machines_excel' },
        { text: '📄 Export PDF', callback_data: 'export_machines_pdf' }
      ],
      [
        { text: '🔧 Maintenance Schedule', callback_data: 'report_maintenance_schedule' },
        { text: '📈 Performance Trends', callback_data: 'report_machine_trends' }
      ],
      [
        { text: '⬅️ Back to Reports', callback_data: 'menu_reports' }
      ]
    ];
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}

export async function exportReport(bot, chatId, reportType, format) {
  const loadingMsg = await bot.sendMessage(chatId, `📥 Generating ${format.toUpperCase()} file...`);
  
  try {
    // Generate report file
    const fileBuffer = await generateReportFile(reportType, format);
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Send file
    const filename = `${reportType}_report_${formatDate(new Date(), 'YYYY-MM-DD')}.${format}`;
    
    await bot.sendDocument(chatId, fileBuffer, {
      caption: `📊 ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report\n` +
               `Generated: ${formatDate(new Date())}`,
      filename: filename
    }, {
      filename: filename,
      contentType: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
    });
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}

export async function showReportPeriodSelection(bot, chatId) {
  await bot.sendMessage(chatId, 
    '📅 *Select Report Period*\n\n' +
    'Choose the time period for your report:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📅 Today', callback_data: 'report_period_today' },
            { text: '📅 This Week', callback_data: 'report_period_week' }
          ],
          [
            { text: '📅 This Month', callback_data: 'report_period_month' },
            { text: '📅 This Year', callback_data: 'report_period_year' }
          ],
          [
            { text: '📅 Custom Range', callback_data: 'report_period_custom' }
          ],
          [
            { text: '❌ Cancel', callback_data: 'menu_reports' }
          ]
        ]
      }
    }
  );
}
