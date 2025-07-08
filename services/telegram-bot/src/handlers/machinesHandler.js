// Machines command handler
import { formatMachineStatus, formatMachineDetails } from '../utils/formatters.js';
import { createPagination } from '../utils/pagination.js';
import { generateMachineQR } from '../utils/qrGenerator.js';

export async function handleMachines(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Show loading message
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Loading machines...');
  
  try {
    // Fetch machines from API
    const response = await global.apiClient.get('/machines', {
      params: {
        limit: 10,
        offset: 0,
        sort: 'name'
      }
    });
    
    const machines = response.data.data;
    const total = response.data.pagination?.total || machines.length;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    if (machines.length === 0) {
      await bot.sendMessage(chatId, 
        '📭 No machines found.\n\n' +
        'Contact administrator to add machines.'
      );
      return;
    }
    
    // Create machines list message
    let message = '🏭 *Vending Machines*\n\n';
    
    machines.forEach((machine, index) => {
      message += `${index + 1}. *${machine.name}*\n`;
      message += `   📍 ${machine.location || 'No location'}\n`;
      message += `   🔧 Status: ${formatMachineStatus(machine.status)}\n`;
      message += `   🆔 ID: \`${machine.id}\`\n\n`;
    });
    
    message += `Total machines: ${total}`;
    
    // Create keyboard with machine buttons
    const keyboard = [];
    
    // Add machine buttons (2 per row)
    for (let i = 0; i < machines.length; i += 2) {
      const row = [];
      row.push({
        text: `📍 ${machines[i].name}`,
        callback_data: `machine_view_${machines[i].id}`
      });
      
      if (i + 1 < machines.length) {
        row.push({
          text: `📍 ${machines[i + 1].name}`,
          callback_data: `machine_view_${machines[i + 1].id}`
        });
      }
      
      keyboard.push(row);
    }
    
    // Add action buttons
    keyboard.push([
      { text: '🔍 Search', callback_data: 'machine_search' },
      { text: '📊 Statistics', callback_data: 'machine_stats' }
    ]);
    
    // Add pagination if needed
    if (total > 10) {
      keyboard.push(createPagination(0, 10, total, 'machines'));
    }
    
    keyboard.push([
      { text: '🏠 Main Menu', callback_data: 'main_menu' }
    ]);
    
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

export async function viewMachine(bot, chatId, machineId) {
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Loading machine details...');
  
  try {
    // Fetch machine details
    const response = await global.apiClient.get(`/machines/${machineId}`);
    const machine = response.data.data;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Format machine details
    const message = formatMachineDetails(machine);
    
    // Create action keyboard
    const keyboard = [
      [
        { text: '📦 Inventory', callback_data: `machine_inventory_${machineId}` },
        { text: '📊 Sales', callback_data: `machine_sales_${machineId}` }
      ],
      [
        { text: '🔧 Service', callback_data: `machine_service_${machineId}` },
        { text: '📋 Tasks', callback_data: `machine_tasks_${machineId}` }
      ],
      [
        { text: '📱 QR Code', callback_data: `machine_qr_${machineId}` },
        { text: '📸 Photo', callback_data: `machine_photo_${machineId}` }
      ]
    ];
    
    // Add admin actions
    const userData = global.userData.get(chatId);
    if (userData?.role === 'admin' || userData?.role === 'technician') {
      keyboard.push([
        { text: '✏️ Edit', callback_data: `machine_edit_${machineId}` },
        { text: '🚨 Report Issue', callback_data: `machine_issue_${machineId}` }
      ]);
    }
    
    keyboard.push([
      { text: '⬅️ Back to Machines', callback_data: 'menu_machines' },
      { text: '🏠 Main Menu', callback_data: 'main_menu' }
    ]);
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
    // If machine has telemetry, show it
    if (machine.telemetry) {
      const telemetryMsg = formatMachineTelemetry(machine.telemetry);
      await bot.sendMessage(chatId, telemetryMsg, {
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}

export async function generateMachineQRCode(bot, chatId, machineId) {
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Generating QR code...');
  
  try {
    // Fetch machine details
    const response = await global.apiClient.get(`/machines/${machineId}`);
    const machine = response.data.data;
    
    // Generate QR code
    const qrBuffer = await generateMachineQR(machine);
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Send QR code
    await bot.sendPhoto(chatId, qrBuffer, {
      caption: `📱 *QR Code for ${machine.name}*\n\n` +
               `Machine ID: \`${machine.id}\`\n` +
               `Location: ${machine.location || 'Not set'}\n\n` +
               `Scan this code to quickly access the machine.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '⬅️ Back', callback_data: `machine_view_${machineId}` }
        ]]
      }
    });
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}

function formatMachineTelemetry(telemetry) {
  let message = '📡 *Telemetry Data*\n\n';
  
  if (telemetry.temperature !== undefined) {
    message += `🌡️ Temperature: ${telemetry.temperature}°C\n`;
  }
  
  if (telemetry.humidity !== undefined) {
    message += `💧 Humidity: ${telemetry.humidity}%\n`;
  }
  
  if (telemetry.powerStatus !== undefined) {
    message += `⚡ Power: ${telemetry.powerStatus ? 'ON' : 'OFF'}\n`;
  }
  
  if (telemetry.doorStatus !== undefined) {
    message += `🚪 Door: ${telemetry.doorStatus ? 'OPEN' : 'CLOSED'}\n`;
  }
  
  if (telemetry.errors && telemetry.errors.length > 0) {
    message += '\n⚠️ *Active Errors:*\n';
    telemetry.errors.forEach(error => {
      message += `• ${error}\n`;
    });
  }
  
  if (telemetry.lastUpdate) {
    message += `\n🕐 Last Update: ${new Date(telemetry.lastUpdate).toLocaleString()}`;
  }
  
  return message;
}
