// Inventory command handler
import { formatInventoryItem, formatCurrency } from '../utils/formatters.js';
import { createPagination } from '../utils/pagination.js';
import { generateInventoryQR } from '../utils/qrGenerator.js';

export async function handleInventory(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Show loading message
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Loading inventory...');
  
  try {
    // Fetch inventory items from API
    const response = await global.apiClient.get('/inventory', {
      params: {
        limit: 10,
        offset: 0,
        sort: 'name'
      }
    });
    
    const items = response.data.data;
    const total = response.data.pagination?.total || items.length;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    if (items.length === 0) {
      await bot.sendMessage(chatId, 
        '📭 No inventory items found.\n\n' +
        'Add items to start managing inventory.'
      );
      return;
    }
    
    // Create inventory list message
    let message = '📦 *Inventory Items*\n\n';
    
    items.forEach((item, index) => {
      const stockStatus = item.quantity <= (item.minQuantity || 0) ? '⚠️' : '✅';
      message += `${index + 1}. *${item.name}* ${stockStatus}\n`;
      message += `   SKU: \`${item.sku}\`\n`;
      message += `   Stock: ${item.quantity} ${item.unit || 'pcs'}\n`;
      message += `   Price: ${formatCurrency(item.price || 0)}\n\n`;
    });
    
    message += `Total items: ${total}`;
    
    // Create keyboard
    const keyboard = [];
    
    // Add action buttons
    keyboard.push([
      { text: '➕ Add Item', callback_data: 'inventory_add' },
      { text: '🔍 Search', callback_data: 'inventory_search' }
    ]);
    
    keyboard.push([
      { text: '⚠️ Low Stock', callback_data: 'inventory_low_stock' },
      { text: '📊 Categories', callback_data: 'inventory_categories' }
    ]);
    
    // Add pagination if needed
    if (total > 10) {
      keyboard.push(createPagination(0, 10, total, 'inventory'));
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

export async function viewInventoryItem(bot, chatId, itemId) {
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Loading item details...');
  
  try {
    // Fetch item details
    const response = await global.apiClient.get(`/inventory/${itemId}`);
    const item = response.data.data;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Format item details
    const message = formatInventoryItem(item);
    
    // Create action keyboard
    const keyboard = [
      [
        { text: '📝 Edit', callback_data: `inventory_edit_${itemId}` },
        { text: '📊 History', callback_data: `inventory_history_${itemId}` }
      ],
      [
        { text: '📱 QR Code', callback_data: `inventory_qr_${itemId}` },
        { text: '🔄 Adjust Stock', callback_data: `inventory_adjust_${itemId}` }
      ]
    ];
    
    const userData = global.userData.get(chatId);
    if (userData?.role === 'admin') {
      keyboard.push([
        { text: '🗑️ Delete', callback_data: `inventory_delete_${itemId}` }
      ]);
    }
    
    keyboard.push([
      { text: '⬅️ Back to Inventory', callback_data: 'menu_inventory' },
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

export async function showLowStockItems(bot, chatId) {
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Loading low stock items...');
  
  try {
    // Fetch low stock items
    const response = await global.apiClient.get('/inventory', {
      params: {
        filter: 'low_stock',
        limit: 20
      }
    });
    
    const items = response.data.data;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    if (items.length === 0) {
      await bot.sendMessage(chatId, 
        '✅ Great! No items are low on stock.',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '⬅️ Back', callback_data: 'menu_inventory' }
            ]]
          }
        }
      );
      return;
    }
    
    // Create low stock message
    let message = '⚠️ *Low Stock Items*\n\n';
    
    items.forEach((item, index) => {
      const percentage = item.minQuantity > 0 
        ? Math.round((item.quantity / item.minQuantity) * 100) 
        : 0;
      
      message += `${index + 1}. *${item.name}*\n`;
      message += `   Current: ${item.quantity} / Min: ${item.minQuantity}\n`;
      message += `   Stock Level: ${percentage}%\n\n`;
    });
    
    // Create keyboard for each item
    const keyboard = [];
    items.forEach(item => {
      keyboard.push([{
        text: `🔄 Restock ${item.name}`,
        callback_data: `inventory_restock_${item.id}`
      }]);
    });
    
    keyboard.push([
      { text: '⬅️ Back', callback_data: 'menu_inventory' }
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

export async function adjustInventoryStock(bot, chatId, itemId) {
  // Set user state for stock adjustment
  if (!global.userStates) global.userStates = new Map();
  
  global.userStates.set(chatId, {
    action: 'inventory_adjust',
    itemId: itemId,
    step: 'select_type'
  });
  
  await bot.sendMessage(chatId, 
    '📊 *Stock Adjustment*\n\n' +
    'Select adjustment type:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '➕ Add Stock', callback_data: 'adjust_add' },
            { text: '➖ Remove Stock', callback_data: 'adjust_remove' }
          ],
          [
            { text: '🔄 Set Quantity', callback_data: 'adjust_set' }
          ],
          [
            { text: '❌ Cancel', callback_data: `inventory_view_${itemId}` }
          ]
        ]
      }
    }
  );
}

export async function generateInventoryQRCode(bot, chatId, itemId) {
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Generating QR code...');
  
  try {
    // Fetch item details
    const response = await global.apiClient.get(`/inventory/${itemId}`);
    const item = response.data.data;
    
    // Generate QR code
    const qrBuffer = await generateInventoryQR(item);
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Send QR code
    await bot.sendPhoto(chatId, qrBuffer, {
      caption: `📱 *QR Code for ${item.name}*\n\n` +
               `SKU: \`${item.sku}\`\n` +
               `Current Stock: ${item.quantity} ${item.unit || 'pcs'}\n\n` +
               `Scan this code for quick access.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '⬅️ Back', callback_data: `inventory_view_${itemId}` }
        ]]
      }
    });
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}
