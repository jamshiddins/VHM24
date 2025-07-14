/**
 * Telegram бот для VHM24
 */
require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const RAILWAY_PUBLIC_URL = process.env.RAILWAY_PUBLIC_URL || 'http://localhost:3000';
const WEBHOOK_URL = process.env.WEBHOOK_URL || `${RAILWAY_PUBLIC_URL}/api/telegram/webhook`;
const API_BASE_URL = process.env.API_BASE_URL || `${RAILWAY_PUBLIC_URL}/api`;
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim());

// Проверка наличия токена
if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
    process.exit(1);
}

// Создание бота
const bot = new Telegraf(BOT_TOKEN);

// Middleware для логирования
bot.use((ctx, next) => {
    const user = ctx.from;
    const message = ctx.message || {};
    .toISOString()}] ${user?.id} (${user?.username}): ${message.text || '[не текст]'}`);
    return next();
});

// Middleware для проверки администратора
const isAdmin = (ctx, next) => {
    const userId = ctx.from?.id?.toString();
    if (userId && ADMIN_IDS.includes(userId)) {
        return next();
    }
    ctx.reply('⛔ Доступ запрещен. Эта команда доступна только администраторам.');
    return false;
};

// Главное меню
const mainMenu = Markup.keyboard([
    ['🏪 Автоматы', '📋 Мои задачи'],
    ['📊 Статус системы', '👤 Профиль'],
    ['❓ Помощь']
]).resize();

// Команда /start
bot.start((ctx) => {
    const welcomeMessage = `
🤖 Добро пожаловать в VHM24 (VendHub Manager)!

Система управления вендинговыми автоматами.

Выберите действие из меню ниже:
    `;
    
    ctx.reply(welcomeMessage, mainMenu);
});

// Команда /help
bot.help((ctx) => {
    const helpMessage = `
📋 Доступные команды:

🏪 Автоматы - Список всех автоматов
📋 Мои задачи - Ваши текущие задачи
📊 Статус системы - Проверка работы API
👤 Профиль - Информация о вашем аккаунте

🔧 Система VHM24 v1.0
Для получения полного доступа обратитесь к администратору.
    `;
    
    ctx.reply(helpMessage, mainMenu);
});

// Обработка кнопок меню
bot.hears('🏪 Автоматы', async (ctx) => {
    await handleMachinesCommand(ctx);
});

bot.hears('📋 Мои задачи', async (ctx) => {
    await handleTasksCommand(ctx);
});

bot.hears('📊 Статус системы', async (ctx) => {
    await handleStatusCommand(ctx);
});

bot.hears('👤 Профиль', (ctx) => {
    handleProfileCommand(ctx);
});

bot.hears('❓ Помощь', (ctx) => {
    ctx.reply(`
📋 Доступные функции:

🏪 Автоматы - Просмотр списка всех вендинговых автоматов
📋 Мои задачи - Ваши назначенные задачи и их статус
📊 Статус системы - Проверка работоспособности API
👤 Профиль - Ваша информация в системе

Для навигации используйте кнопки меню.
    `, mainMenu);
});

// Команда /status
async function handleStatusCommand(ctx) {
    try {
        ctx.reply('🔄 Проверяю статус системы...');
        
        const response = await axios.get(`${API_BASE_URL}/health`, {
            timeout: 5000
        });
        
        const data = response.data;
        const statusMessage = `
✅ Система работает нормально

📊 Статус API: ${response.status === 200 ? 'OK' : 'Ошибка'}
🕐 Время работы: ${Math.floor(data.uptime / 60)} мин
📅 Последняя проверка: ${new Date().toLocaleString('ru-RU')}
🔧 Версия: ${data.version || '1.0.0'}
        `;
        
        ctx.reply(statusMessage, mainMenu);
    } catch (error) {
        console.error('Ошибка проверки статуса:', error.message);
        ctx.reply(`
❌ Ошибка подключения к API

🔍 Возможные причины:
• API сервер не запущен
• Проблемы с сетью
• Неверный URL API: ${API_BASE_URL}

Обратитесь к администратору.
        `, mainMenu);
    }
}

// Команда /machines
async function handleMachinesCommand(ctx) {
    try {
        ctx.reply('🔄 Загружаю список автоматов...');
        
        const response = await axios.get(`${API_BASE_URL}/machines`, {
            timeout: 5000
        });
        
        const machines = response.data;
        
        if (machines && machines.length > 0) {
            let message = '🏪 Список автоматов:\n\n';
            machines.forEach((machine, index) => {
                const statusIcon = machine.status === 'ACTIVE' ? '🟢' : 
                                 machine.status === 'MAINTENANCE' ? '🟡' : '🔴';
                
                message += `${index + 1}. ${machine.name || machine.id}\n`;
                message += `   📍 ${machine.location || 'Не указано'}\n`;
                message += `   🏷️ ${machine.model || 'Неизвестно'}\n`;
                message += `   ${statusIcon} ${machine.status || 'Неизвестно'}\n\n`;
            });
            
            ctx.reply(message, mainMenu);
        } else {
            ctx.reply('📭 Автоматы не найдены', mainMenu);
        }
    } catch (error) {
        console.error('Ошибка получения автоматов:', error.message);
        ctx.reply(`
❌ Ошибка получения списка автоматов

🔍 Проверьте:
• Подключение к API
• Права доступа

Попробуйте позже или обратитесь к администратору.
        `, mainMenu);
    }
}

// Команда /tasks
async function handleTasksCommand(ctx) {
    try {
        ctx.reply('🔄 Загружаю ваши задачи...');
        
        const userId = ctx.from.id;
        const response = await axios.get(`${API_BASE_URL}/tasks?userId=${userId}`, {
            timeout: 5000
        });
        
        const tasks = response.data;
        
        if (tasks && tasks.length > 0) {
            let message = '📋 Ваши задачи:\n\n';
            tasks.forEach((task, index) => {
                const statusIcon = task.status === 'PENDING' ? '⏳' : 
                                 task.status === 'IN_PROGRESS' ? '🔄' : 
                                 task.status === 'COMPLETED' ? '✅' : '❓';
                
                const dueDate = task.dueDate ? 
                    new Date(task.dueDate).toLocaleDateString('ru-RU') : 
                    'Без срока';
                
                message += `${index + 1}. ${task.title || task.type}\n`;
                message += `   📅 Срок: ${dueDate}\n`;
                message += `   ${statusIcon} ${task.status || 'Новая'}\n`;
                if (task.description) {
                    message += `   📝 ${task.description}\n`;
                }
                message += `\n`;
            });
            
            ctx.reply(message, mainMenu);
        } else {
            ctx.reply(`
📭 У вас нет активных задач

Возможные причины:
• Задачи еще не назначены
• Все задачи выполнены
• Проблемы с загрузкой данных

Обратитесь к менеджеру для получения новых задач.
            `, mainMenu);
        }
    } catch (error) {
        console.error('Ошибка получения задач:', error.message);
        ctx.reply(`
❌ Ошибка получения задач

🔍 Проверьте подключение к системе.
Попробуйте позже или обратитесь к администратору.
        `, mainMenu);
    }
}

// Команда /profile
function handleProfileCommand(ctx) {
    const user = ctx.from;
    const profileMessage = `
👤 Ваш профиль:

🆔 ID: ${user.id}
👤 Имя: ${user.first_name || 'Не указано'}
👤 Фамилия: ${user.last_name || 'Не указано'}
📝 Username: @${user.username || 'Не указано'}
🌐 Язык: ${user.language_code || 'Не указано'}

🔧 Роль в системе: ${ADMIN_IDS.includes(user.id.toString()) ? 'Администратор' : 'Пользователь'}
📅 Дата регистрации: ${new Date().toLocaleDateString('ru-RU')}

Для настройки роли и прав доступа обратитесь к администратору.
    `;
    
    ctx.reply(profileMessage, mainMenu);
}

// Команда /webhook (только для администраторов)
bot.command('webhook', isAdmin, async (ctx) => {
    try {
        ctx.reply('🔄 Настраиваю вебхук...');
        
        // Установка вебхука через API
        const response = await axios.post(`${API_BASE_URL}/telegram/setWebhook?token=${BOT_TOKEN}`, {
            url: WEBHOOK_URL
        }, {
            timeout: 5000
        });
        
        if (response.data && response.data.success) {
            ctx.reply(`
✅ Вебхук успешно настроен

🔗 URL: ${WEBHOOK_URL}
📅 Дата: ${new Date().toLocaleString('ru-RU')}
            `);
        } else {
            throw new Error('Ошибка настройки вебхука');
        }
    } catch (error) {
        console.error('Ошибка настройки вебхука:', error.message);
        ctx.reply(`
❌ Ошибка настройки вебхука

🔍 Возможные причины:
• API сервер не запущен
• Проблемы с сетью
• Неверный URL API или токен

Подробности: ${error.message}
        `);
    }
});

// Обработка неизвестных команд и текста
bot.on('text', (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
        ctx.reply(`
🤔 Я не понимаю это сообщение.

Используйте кнопки меню для навигации или команду /help для получения справки.
        `, mainMenu);
    }
});

// Обработка ошибок
bot.catch((err, ctx) => {
    console.error('❌ Ошибка бота:', err);
    ctx.reply('❌ Произошла ошибка. Попробуйте позже.', mainMenu);
});

// Настройка вебхука
async function setupWebhook() {
    try {
        if (process.env.NODE_ENV === 'production') {
            
            
            // Проверка доступности API
            try {
                await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
                
                
                // Установка вебхука через API
                const response = await axios.post(`${API_BASE_URL}/telegram/setWebhook?token=${BOT_TOKEN}`, {
                    url: WEBHOOK_URL
                }, {
                    timeout: 5000
                });
                
                if (response.data && response.data.success) {
                    
                } else {
                    console.warn('⚠️ Ответ API не подтвердил успешную настройку вебхука');
                }
            } catch (error) {
                console.error('❌ Ошибка настройки вебхука:', error.message);
                
            }
        } else {
            
        }
    } catch (error) {
        console.error('❌ Ошибка настройки вебхука:', error);
    }
}

// Запуск бота
async function startBot() {
    try {
        
        
        // Настройка вебхука
        await setupWebhook();
        
        // Проверка подключения к API
        try {
            const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
            
        } catch (error) {
            console.error(`❌ Ошибка подключения к API: ${error.message}`);
        }
        
        // Запуск бота
        await bot.launch();
        
        
        // Вывод информации о конфигурации
         || 'Не настроены'}`);
        
        // Graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        
    } catch (error) {
        console.error('❌ Ошибка запуска бота:', error);
        process.exit(1);
    }
}

// Запуск
if (require.main === module) {
    startBot();
}

module.exports = { bot, startBot };
