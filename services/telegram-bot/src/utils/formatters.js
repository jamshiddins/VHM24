// Formatting utilities
const moment = require('moment');

function formatMachineStatus(status) {
  const statusMap = {
    'active': '✅ Active',
    'inactive': '⚠️ Inactive',
    'maintenance': '🔧 Maintenance',
    'error': '❌ Error',
    'offline': '📴 Offline'
  };
  
  return statusMap[status] || status;
}

function formatMachineDetails(machine) {
  let message = `🏭 *${machine.name}*\n\n`;
  
  message += `📍 *Location:* ${machine.location || 'Not specified'}\n`;
  message += `🔧 *Status:* ${formatMachineStatus(machine.status)}\n`;
  message += `🏷️ *Model:* ${machine.model || 'Unknown'}\n`;
  message += `🔢 *Serial:* \`${machine.serialNumber || 'N/A'}\`\n`;
  message += `🆔 *ID:* \`${machine.id}\`\n`;
  
  if (machine.lastServiceDate) {
    message += `\n🛠️ *Last Service:* ${moment(machine.lastServiceDate).format('DD.MM.YYYY')}\n`;
  }
  
  if (machine.coordinates) {
    message += `\n📌 *Coordinates:* ${machine.coordinates.lat}, ${machine.coordinates.lng}\n`;
  }
  
  if (machine.description) {
    message += `\n📝 *Description:* ${machine.description}\n`;
  }
  
  if (machine.stats) {
    message += '\n📊 *Statistics:*\n';
    if (machine.stats.totalSales !== undefined) {
      message += `• Total Sales: ${machine.stats.totalSales}\n`;
    }
    if (machine.stats.todaySales !== undefined) {
      message += `• Today Sales: ${machine.stats.todaySales}\n`;
    }
    if (machine.stats.revenue !== undefined) {
      message += `• Revenue: $${machine.stats.revenue.toFixed(2)}\n`;
    }
  }
  
  return message;
}

function formatInventoryItem(item) {
  let message = `📦 *${item.name}*\n`;
  
  message += `• SKU: \`${item.sku}\`\n`;
  message += `• Category: ${item.category || 'Uncategorized'}\n`;
  message += `• Price: $${(item.price || 0).toFixed(2)}\n`;
  message += `• Stock: ${item.quantity || 0} ${item.unit || 'pcs'}\n`;
  
  if (item.minQuantity) {
    const stockStatus = item.quantity <= item.minQuantity ? '⚠️ Low' : '✅ OK';
    message += `• Min Stock: ${item.minQuantity} (${stockStatus})\n`;
  }
  
  if (item.expiryDate) {
    const isExpired = new Date(item.expiryDate) < new Date();
    const expiryStatus = isExpired ? '❌ Expired' : '✅ Valid';
    message += `• Expiry: ${moment(item.expiryDate).format('DD.MM.YYYY')} (${expiryStatus})\n`;
  }
  
  return message;
}

function formatTask(task) {
  const priorityEmojis = {
    'low': '🟢',
    'medium': '🟡',
    'high': '🟠',
    'urgent': '🔴'
  };
  
  const statusEmojis = {
    'pending': '⏳',
    'in_progress': '🔄',
    'completed': '✅',
    'cancelled': '❌'
  };
  
  let message = `${statusEmojis[task.status] || '❓'} *${task.title}*\n`;
  
  message += `• Priority: ${priorityEmojis[task.priority] || '❓'} ${task.priority || 'normal'}\n`;
  message += `• Type: ${task.type || 'general'}\n`;
  
  if (task.assignedTo) {
    message += `• Assigned to: ${task.assignedTo.name || task.assignedTo.username}\n`;
  }
  
  if (task.dueDate) {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
    message += `• Due: ${moment(task.dueDate).format('DD.MM.YYYY HH:mm')}${isOverdue ? ' ⚠️ Overdue' : ''}\n`;
  }
  
  if (task.machine) {
    message += `• Machine: ${task.machine.name}\n`;
  }
  
  if (task.description) {
    message += `\n📝 ${task.description}\n`;
  }
  
  return message;
}

function formatDate(date, format = 'DD.MM.YYYY HH:mm') {
  return moment(date).format(format);
}

function formatCurrency(amount, currency = 'USD') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  });
  
  return formatter.format(amount);
}

function formatNumber(number, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

function formatPercentage(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatDuration(seconds) {
  const duration = moment.duration(seconds, 'seconds');
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  
  let result = [];
  if (days > 0) result.push(`${days}d`);
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  
  return result.join(' ') || '< 1m';
}

function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function escapeMarkdown(text) {
  return text.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
}

module.exports = { formatMachineStatus, formatMachineDetails, formatInventoryItem, formatTask, formatDate, formatCurrency, formatNumber, formatPercentage, formatDuration, truncate, escapeMarkdown };
