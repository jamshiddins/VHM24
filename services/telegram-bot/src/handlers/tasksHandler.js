// Tasks command handler
import { formatTask, formatDate } from '../utils/formatters.js';
import { createPagination } from '../utils/pagination.js';
import { generateTaskQR } from '../utils/qrGenerator.js';

export async function handleTasks(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Show loading message
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Loading tasks...');
  
  try {
    // Get user data to filter tasks
    const userData = global.userData.get(userId);
    
    // Fetch tasks from API
    const params = {
      limit: 10,
      offset: 0,
      sort: '-createdAt'
    };
    
    // Filter by assigned user if not admin
    if (userData?.role !== 'admin') {
      params.assignedTo = userData?.id;
    }
    
    const response = await global.apiClient.get('/tasks', { params });
    
    const tasks = response.data.data;
    const total = response.data.pagination?.total || tasks.length;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    if (tasks.length === 0) {
      await bot.sendMessage(chatId, 
        '📭 No tasks found.\n\n' +
        'Tasks will appear here when assigned.'
      );
      return;
    }
    
    // Create tasks list message
    let message = '📋 *Tasks*\n\n';
    
    // Group tasks by status
    const groupedTasks = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: []
    };
    
    tasks.forEach(task => {
      groupedTasks[task.status]?.push(task);
    });
    
    // Display active tasks first
    ['in_progress', 'pending'].forEach(status => {
      if (groupedTasks[status].length > 0) {
        groupedTasks[status].forEach((task, index) => {
          message += formatTask(task) + '\n';
        });
      }
    });
    
    message += `\nTotal tasks: ${total}`;
    
    // Create keyboard
    const keyboard = [];
    
    // Add filter buttons
    keyboard.push([
      { text: '⏳ Pending', callback_data: 'tasks_filter_pending' },
      { text: '🔄 In Progress', callback_data: 'tasks_filter_in_progress' },
      { text: '✅ Completed', callback_data: 'tasks_filter_completed' }
    ]);
    
    // Add action buttons
    keyboard.push([
      { text: '➕ Create Task', callback_data: 'task_create' },
      { text: '📅 Calendar View', callback_data: 'tasks_calendar' }
    ]);
    
    keyboard.push([
      { text: '🔍 Search', callback_data: 'tasks_search' },
      { text: '📊 Statistics', callback_data: 'tasks_stats' }
    ]);
    
    // Add pagination if needed
    if (total > 10) {
      keyboard.push(createPagination(0, 10, total, 'tasks'));
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

export async function viewTask(bot, chatId, taskId) {
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Loading task details...');
  
  try {
    // Fetch task details
    const response = await global.apiClient.get(`/tasks/${taskId}`);
    const task = response.data.data;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Format task details
    let message = formatTask(task);
    
    // Add additional details
    if (task.createdAt) {
      message += `\n📅 Created: ${formatDate(task.createdAt)}`;
    }
    
    if (task.startedAt) {
      message += `\n🚀 Started: ${formatDate(task.startedAt)}`;
    }
    
    if (task.completedAt) {
      message += `\n✅ Completed: ${formatDate(task.completedAt)}`;
    }
    
    if (task.notes && task.notes.length > 0) {
      message += '\n\n📝 *Notes:*\n';
      task.notes.forEach((note, index) => {
        message += `${index + 1}. ${note.text} - _${formatDate(note.createdAt, 'DD.MM HH:mm')}_\n`;
      });
    }
    
    // Create action keyboard based on task status
    const keyboard = [];
    const userData = global.userData.get(chatId);
    const canEdit = userData?.role === 'admin' || task.assignedTo?.id === userData?.id;
    
    if (canEdit) {
      switch (task.status) {
        case 'pending':
          keyboard.push([
            { text: '▶️ Start Task', callback_data: `task_start_${taskId}` },
            { text: '✏️ Edit', callback_data: `task_edit_${taskId}` }
          ]);
          break;
        case 'in_progress':
          keyboard.push([
            { text: '✅ Complete', callback_data: `task_complete_${taskId}` },
            { text: '⏸️ Pause', callback_data: `task_pause_${taskId}` }
          ]);
          break;
        case 'completed':
          keyboard.push([
            { text: '🔄 Reopen', callback_data: `task_reopen_${taskId}` }
          ]);
          break;
      }
      
      if (task.status !== 'cancelled' && task.status !== 'completed') {
        keyboard.push([
          { text: '📝 Add Note', callback_data: `task_note_${taskId}` },
          { text: '❌ Cancel', callback_data: `task_cancel_${taskId}` }
        ]);
      }
    }
    
    keyboard.push([
      { text: '📱 QR Code', callback_data: `task_qr_${taskId}` },
      { text: '📊 Activity Log', callback_data: `task_log_${taskId}` }
    ]);
    
    if (task.machineId) {
      keyboard.push([
        { text: '🏭 View Machine', callback_data: `machine_view_${task.machineId}` }
      ]);
    }
    
    keyboard.push([
      { text: '⬅️ Back to Tasks', callback_data: 'menu_tasks' },
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

export async function startTask(bot, chatId, taskId) {
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Starting task...');
  
  try {
    // Update task status
    const response = await global.apiClient.patch(`/tasks/${taskId}`, {
      status: 'in_progress',
      startedAt: new Date().toISOString()
    });
    
    const task = response.data.data;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    await bot.sendMessage(chatId, 
      `✅ Task started successfully!\n\n` +
      `*${task.title}* is now in progress.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '📋 View Task', callback_data: `task_view_${taskId}` }
          ]]
        }
      }
    );
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}

export async function completeTask(bot, chatId, taskId) {
  // Set user state for completion notes
  if (!global.userStates) global.userStates = new Map();
  
  global.userStates.set(chatId, {
    action: 'task_complete',
    taskId: taskId,
    step: 'notes'
  });
  
  await bot.sendMessage(chatId, 
    '✅ *Complete Task*\n\n' +
    'Please provide completion notes (optional).\n' +
    'Send your notes or click Skip to complete without notes.',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '⏭️ Skip Notes', callback_data: `task_complete_confirm_${taskId}` },
          { text: '❌ Cancel', callback_data: `task_view_${taskId}` }
        ]]
      }
    }
  );
}

export async function generateTaskQRCode(bot, chatId, taskId) {
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Generating QR code...');
  
  try {
    // Fetch task details
    const response = await global.apiClient.get(`/tasks/${taskId}`);
    const task = response.data.data;
    
    // Generate QR code
    const qrBuffer = await generateTaskQR(task);
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    // Send QR code
    await bot.sendPhoto(chatId, qrBuffer, {
      caption: `📱 *QR Code for Task*\n\n` +
               `Title: ${task.title}\n` +
               `Status: ${task.status}\n` +
               `Priority: ${task.priority}\n\n` +
               `Scan this code for quick access.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '⬅️ Back', callback_data: `task_view_${taskId}` }
        ]]
      }
    });
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}

export async function showTasksCalendar(bot, chatId) {
  // This would show a calendar view of tasks
  // For now, show tasks grouped by due date
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Loading calendar...');
  
  try {
    const response = await global.apiClient.get('/tasks', {
      params: {
        sort: 'dueDate',
        status: ['pending', 'in_progress'],
        limit: 30
      }
    });
    
    const tasks = response.data.data;
    
    // Delete loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    if (tasks.length === 0) {
      await bot.sendMessage(chatId, '📅 No upcoming tasks.');
      return;
    }
    
    // Group tasks by date
    const tasksByDate = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        const date = formatDate(task.dueDate, 'DD.MM.YYYY');
        if (!tasksByDate[date]) {
          tasksByDate[date] = [];
        }
        tasksByDate[date].push(task);
      }
    });
    
    let message = '📅 *Tasks Calendar*\n\n';
    
    Object.entries(tasksByDate).forEach(([date, dateTasks]) => {
      message += `*${date}*\n`;
      dateTasks.forEach(task => {
        const time = formatDate(task.dueDate, 'HH:mm');
        message += `• ${time} - ${task.title}\n`;
      });
      message += '\n';
    });
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '⬅️ Back', callback_data: 'menu_tasks' }
        ]]
      }
    });
  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    throw error;
  }
}
