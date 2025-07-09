const { FSMManager } = require('../fsm/manager');
const { STATES } = require('../fsm/states');
const logger = require('@vhm24/shared/utils/logger');

class TechnicianHandler {
    constructor(bot, prisma) {
        this.bot = bot;
        this.prisma = prisma;
        this.fsmManager = new FSMManager();
    }

    async showTechnicianMenu(chatId, userId) {
        try {
            logger.info(`Showing technician menu for user ${userId}`);
            
            // Проверяем роль пользователя
            const user = await this.prisma.user.findUnique({
                where: { telegramId: userId.toString() },
                include: { role: true }
            });

            if (!user || user.role.name !== 'TECHNICIAN') {
                await this.bot.sendMessage(chatId, '❌ У вас нет доступа к функциям техника');
                return;
            }

            // Устанавливаем состояние FSM
            await this.fsmManager.setState(userId, STATES.TECHNICIAN_MENU);

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '🔧 Начать ТО', callback_data: 'tech_start_maintenance' },
                        { text: '📋 Чек-листы', callback_data: 'tech_checklists' }
                    ],
                    [
                        { text: '🔩 Замена деталей', callback_data: 'tech_parts_replacement' },
                        { text: '📊 Мои отчёты', callback_data: 'tech_reports' }
                    ],
                    [
                        { text: '🚨 Сообщить о проблеме', callback_data: 'tech_report_problem' },
                        { text: '📱 Настройки', callback_data: 'settings' }
                    ],
                    [
                        { text: '🏠 Главное меню', callback_data: 'main_menu' }
                    ]
                ]
            };

            await this.bot.sendMessage(chatId, 
                '🔧 *Меню техника*\n\n' +
                'Выберите действие:\n' +
                '• Техническое обслуживание\n' +
                '• Работа с чек-листами\n' +
                '• Замена деталей\n' +
                '• Отчёты и проблемы',
                { 
                    parse_mode: 'Markdown',
                    reply_markup: keyboard 
                }
            );

        } catch (error) {
            logger.error('Error showing technician menu:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при загрузке меню техника');
        }
    }

    async startMaintenance(chatId, userId) {
        try {
            logger.info(`Starting maintenance for technician ${userId}`);

            // Получаем список доступных автоматов для ТО
            const machines = await this.prisma.machine.findMany({
                where: {
                    OR: [
                        { status: 'MAINTENANCE_REQUIRED' },
                        { status: 'OFFLINE' }
                    ]
                },
                include: {
                    location: true
                }
            });

            if (machines.length === 0) {
                await this.bot.sendMessage(chatId, 
                    '✅ Все автоматы в рабочем состоянии!\n' +
                    'Нет автоматов, требующих технического обслуживания.'
                );
                return;
            }

            await this.fsmManager.setState(userId, STATES.TECHNICIAN_SELECT_MACHINE);

            const keyboard = {
                inline_keyboard: machines.map(machine => ([
                    { 
                        text: `🏪 ${machine.location.name} - ${machine.model}`, 
                        callback_data: `tech_select_machine_${machine.id}` 
                    }
                ])).concat([[
                    { text: '🔙 Назад', callback_data: 'technician_menu' }
                ]])
            };

            await this.bot.sendMessage(chatId,
                '🔧 *Выберите автомат для ТО*\n\n' +
                `Найдено ${machines.length} автоматов, требующих обслуживания:`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                }
            );

        } catch (error) {
            logger.error('Error starting maintenance:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при запуске ТО');
        }
    }

    async selectMachineForMaintenance(chatId, userId, machineId) {
        try {
            const machine = await this.prisma.machine.findUnique({
                where: { id: parseInt(machineId) },
                include: { 
                    location: true,
                    maintenanceTasks: {
                        where: { status: 'PENDING' },
                        orderBy: { priority: 'desc' }
                    }
                }
            });

            if (!machine) {
                await this.bot.sendMessage(chatId, '❌ Автомат не найден');
                return;
            }

            // Создаем новую задачу ТО
            const maintenanceTask = await this.prisma.maintenanceTask.create({
                data: {
                    machineId: machine.id,
                    technicianId: parseInt(userId),
                    type: 'ROUTINE',
                    status: 'IN_PROGRESS',
                    priority: 'MEDIUM',
                    description: `Плановое ТО автомата ${machine.model}`,
                    scheduledDate: new Date()
                }
            });

            await this.fsmManager.setState(userId, STATES.TECHNICIAN_MAINTENANCE, {
                machineId: machine.id,
                taskId: maintenanceTask.id
            });

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '📋 Начать чек-лист', callback_data: `tech_start_checklist_${maintenanceTask.id}` }
                    ],
                    [
                        { text: '🔩 Замена деталей', callback_data: `tech_parts_${maintenanceTask.id}` },
                        { text: '📸 Добавить фото', callback_data: `tech_photo_${maintenanceTask.id}` }
                    ],
                    [
                        { text: '✅ Завершить ТО', callback_data: `tech_complete_${maintenanceTask.id}` }
                    ],
                    [
                        { text: '🔙 Назад', callback_data: 'tech_start_maintenance' }
                    ]
                ]
            };

            await this.bot.sendMessage(chatId,
                `🔧 *ТО автомата*\n\n` +
                `📍 Локация: ${machine.location.name}\n` +
                `🤖 Модель: ${machine.model}\n` +
                `📊 Статус: ${machine.status}\n` +
                `🆔 Задача: #${maintenanceTask.id}\n\n` +
                `Выберите действие:`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                }
            );

        } catch (error) {
            logger.error('Error selecting machine for maintenance:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при выборе автомата');
        }
    }

    async startChecklist(chatId, userId, taskId) {
        try {
            const task = await this.prisma.maintenanceTask.findUnique({
                where: { id: parseInt(taskId) },
                include: { 
                    machine: { include: { location: true } },
                    checklistItems: true
                }
            });

            if (!task) {
                await this.bot.sendMessage(chatId, '❌ Задача не найдена');
                return;
            }

            // Стандартный чек-лист для ТО
            const standardChecklist = [
                'Проверка внешнего состояния',
                'Проверка дисплея и интерфейса',
                'Проверка купюроприемника',
                'Проверка монетоприемника',
                'Проверка системы выдачи',
                'Проверка температурного режима',
                'Проверка уровня товаров',
                'Очистка и дезинфекция',
                'Проверка подключений',
                'Тестирование работы'
            ];

            // Создаем элементы чек-листа если их нет
            if (task.checklistItems.length === 0) {
                for (let i = 0; i < standardChecklist.length; i++) {
                    await this.prisma.checklistItem.create({
                        data: {
                            taskId: task.id,
                            description: standardChecklist[i],
                            order: i + 1,
                            status: 'PENDING'
                        }
                    });
                }
            }

            await this.fsmManager.setState(userId, STATES.TECHNICIAN_CHECKLIST, {
                taskId: task.id,
                currentItem: 0
            });

            await this.showNextChecklistItem(chatId, userId, task.id, 0);

        } catch (error) {
            logger.error('Error starting checklist:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при запуске чек-листа');
        }
    }

    async showNextChecklistItem(chatId, userId, taskId, itemIndex) {
        try {
            const items = await this.prisma.checklistItem.findMany({
                where: { taskId: parseInt(taskId) },
                orderBy: { order: 'asc' }
            });

            if (itemIndex >= items.length) {
                await this.completeChecklist(chatId, userId, taskId);
                return;
            }

            const currentItem = items[itemIndex];
            const completedCount = items.filter(item => item.status === 'COMPLETED').length;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Выполнено', callback_data: `tech_check_ok_${currentItem.id}_${itemIndex}` },
                        { text: '❌ Проблема', callback_data: `tech_check_issue_${currentItem.id}_${itemIndex}` }
                    ],
                    [
                        { text: '📸 Добавить фото', callback_data: `tech_check_photo_${currentItem.id}` }
                    ],
                    [
                        { text: '⏭️ Пропустить', callback_data: `tech_check_skip_${currentItem.id}_${itemIndex}` }
                    ]
                ]
            };

            await this.bot.sendMessage(chatId,
                `📋 *Чек-лист ТО*\n\n` +
                `Пункт ${itemIndex + 1} из ${items.length}\n` +
                `Выполнено: ${completedCount}/${items.length}\n\n` +
                `🔍 **${currentItem.description}**\n\n` +
                `Отметьте результат проверки:`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                }
            );

        } catch (error) {
            logger.error('Error showing checklist item:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при отображении чек-листа');
        }
    }

    async handleChecklistItem(chatId, userId, itemId, itemIndex, status, comment = null) {
        try {
            await this.prisma.checklistItem.update({
                where: { id: parseInt(itemId) },
                data: {
                    status: status,
                    comment: comment,
                    completedAt: status === 'COMPLETED' ? new Date() : null
                }
            });

            const nextIndex = parseInt(itemIndex) + 1;
            const item = await this.prisma.checklistItem.findUnique({
                where: { id: parseInt(itemId) }
            });

            await this.showNextChecklistItem(chatId, userId, item.taskId, nextIndex);

        } catch (error) {
            logger.error('Error handling checklist item:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при обработке пункта чек-листа');
        }
    }

    async completeChecklist(chatId, userId, taskId) {
        try {
            const items = await this.prisma.checklistItem.findMany({
                where: { taskId: parseInt(taskId) }
            });

            const completedCount = items.filter(item => item.status === 'COMPLETED').length;
            const issuesCount = items.filter(item => item.status === 'ISSUE').length;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '🔩 Замена деталей', callback_data: `tech_parts_${taskId}` },
                        { text: '📸 Добавить фото', callback_data: `tech_photo_${taskId}` }
                    ],
                    [
                        { text: '✅ Завершить ТО', callback_data: `tech_complete_${taskId}` }
                    ],
                    [
                        { text: '🔙 К задаче', callback_data: `tech_task_${taskId}` }
                    ]
                ]
            };

            await this.bot.sendMessage(chatId,
                `✅ *Чек-лист завершён!*\n\n` +
                `📊 Результаты:\n` +
                `• Выполнено: ${completedCount}/${items.length}\n` +
                `• Проблем: ${issuesCount}\n\n` +
                `Что делать дальше?`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                }
            );

        } catch (error) {
            logger.error('Error completing checklist:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при завершении чек-листа');
        }
    }

    async reportPartReplacement(chatId, userId, taskId) {
        try {
            await this.fsmManager.setState(userId, STATES.TECHNICIAN_PART_REPLACEMENT, {
                taskId: taskId
            });

            await this.bot.sendMessage(chatId,
                '🔩 *Замена деталей*\n\n' +
                'Введите информацию о замененной детали:\n\n' +
                'Формат: Название детали | Серийный номер | Причина замены\n\n' +
                'Пример: Купюроприемник | SN123456 | Не принимает купюры',
                { parse_mode: 'Markdown' }
            );

        } catch (error) {
            logger.error('Error reporting part replacement:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при регистрации замены детали');
        }
    }

    async handlePartReplacementInput(chatId, userId, text) {
        try {
            const state = await this.fsmManager.getState(userId);
            const taskId = state.data.taskId;

            const parts = text.split('|').map(part => part.trim());
            if (parts.length !== 3) {
                await this.bot.sendMessage(chatId,
                    '❌ Неверный формат!\n\n' +
                    'Используйте: Название | Серийный номер | Причина'
                );
                return;
            }

            const [partName, serialNumber, reason] = parts;

            await this.prisma.partReplacement.create({
                data: {
                    taskId: parseInt(taskId),
                    partName: partName,
                    serialNumber: serialNumber,
                    reason: reason,
                    replacedAt: new Date()
                }
            });

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '📸 Добавить фото', callback_data: `tech_part_photo_${taskId}` }
                    ],
                    [
                        { text: '🔩 Ещё деталь', callback_data: `tech_parts_${taskId}` },
                        { text: '✅ Готово', callback_data: `tech_task_${taskId}` }
                    ]
                ]
            };

            await this.bot.sendMessage(chatId,
                `✅ *Замена зарегистрирована*\n\n` +
                `🔩 Деталь: ${partName}\n` +
                `🏷️ Серийный номер: ${serialNumber}\n` +
                `📝 Причина: ${reason}\n\n` +
                `Добавить фото или продолжить?`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                }
            );

            await this.fsmManager.setState(userId, STATES.TECHNICIAN_MAINTENANCE, {
                taskId: taskId
            });

        } catch (error) {
            logger.error('Error handling part replacement input:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при сохранении информации о детали');
        }
    }

    async completeMaintenanceReport(chatId, userId, taskId) {
        try {
            const task = await this.prisma.maintenanceTask.findUnique({
                where: { id: parseInt(taskId) },
                include: {
                    machine: { include: { location: true } },
                    checklistItems: true,
                    partReplacements: true
                }
            });

            if (!task) {
                await this.bot.sendMessage(chatId, '❌ Задача не найдена');
                return;
            }

            // Обновляем статус задачи
            await this.prisma.maintenanceTask.update({
                where: { id: parseInt(taskId) },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });

            // Обновляем статус автомата
            const issuesCount = task.checklistItems.filter(item => item.status === 'ISSUE').length;
            const newMachineStatus = issuesCount > 0 ? 'MAINTENANCE_REQUIRED' : 'ONLINE';

            await this.prisma.machine.update({
                where: { id: task.machineId },
                data: { status: newMachineStatus }
            });

            // Формируем отчёт
            const completedItems = task.checklistItems.filter(item => item.status === 'COMPLETED').length;
            const totalItems = task.checklistItems.length;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '📋 Новое ТО', callback_data: 'tech_start_maintenance' }
                    ],
                    [
                        { text: '🏠 Главное меню', callback_data: 'main_menu' }
                    ]
                ]
            };

            await this.bot.sendMessage(chatId,
                `✅ *ТО завершено!*\n\n` +
                `📍 Локация: ${task.machine.location.name}\n` +
                `🤖 Автомат: ${task.machine.model}\n` +
                `🆔 Задача: #${task.id}\n\n` +
                `📊 Результаты:\n` +
                `• Чек-лист: ${completedItems}/${totalItems}\n` +
                `• Проблем: ${issuesCount}\n` +
                `• Замен деталей: ${task.partReplacements.length}\n` +
                `• Статус автомата: ${newMachineStatus}\n\n` +
                `⏰ Завершено: ${new Date().toLocaleString('ru-RU')}`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                }
            );

            await this.fsmManager.setState(userId, STATES.TECHNICIAN_MENU);

            // Отправляем уведомление менеджерам
            await this.sendMaintenanceNotification(task, issuesCount);

        } catch (error) {
            logger.error('Error completing maintenance report:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при завершении отчёта ТО');
        }
    }

    async sendMaintenanceNotification(task, issuesCount) {
        try {
            // Получаем менеджеров для уведомления
            const managers = await this.prisma.user.findMany({
                where: {
                    role: { name: 'MANAGER' },
                    telegramId: { not: null }
                }
            });

            const message = 
                `🔧 *Завершено ТО*\n\n` +
                `📍 ${task.machine.location.name}\n` +
                `🤖 ${task.machine.model}\n` +
                `👨‍🔧 Техник: ${task.technicianId}\n` +
                `⚠️ Проблем: ${issuesCount}\n` +
                `⏰ ${new Date().toLocaleString('ru-RU')}`;

            for (const manager of managers) {
                try {
                    await this.bot.sendMessage(manager.telegramId, message, {
                        parse_mode: 'Markdown'
                    });
                } catch (error) {
                    logger.warn(`Failed to send notification to manager ${manager.id}:`, error);
                }
            }

        } catch (error) {
            logger.error('Error sending maintenance notification:', error);
        }
    }

    async showReports(chatId, userId) {
        try {
            const reports = await this.prisma.maintenanceTask.findMany({
                where: { 
                    technicianId: parseInt(userId),
                    status: 'COMPLETED'
                },
                include: {
                    machine: { include: { location: true } }
                },
                orderBy: { completedAt: 'desc' },
                take: 10
            });

            if (reports.length === 0) {
                await this.bot.sendMessage(chatId, 
                    '📊 У вас пока нет завершённых отчётов ТО'
                );
                return;
            }

            let message = '📊 *Ваши отчёты ТО*\n\n';
            
            reports.forEach((report, index) => {
                message += `${index + 1}. 🏪 ${report.machine.location.name}\n`;
                message += `   📅 ${report.completedAt.toLocaleDateString('ru-RU')}\n`;
                message += `   🆔 #${report.id}\n\n`;
            });

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '🔙 Назад', callback_data: 'technician_menu' }
                    ]
                ]
            };

            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });

        } catch (error) {
            logger.error('Error showing reports:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при загрузке отчётов');
        }
    }

    async reportProblem(chatId, userId) {
        try {
            await this.fsmManager.setState(userId, STATES.TECHNICIAN_REPORT_PROBLEM);

            await this.bot.sendMessage(chatId,
                '🚨 *Сообщить о проблеме*\n\n' +
                'Опишите проблему подробно:\n' +
                '• Что произошло?\n' +
                '• Где произошло?\n' +
                '• Когда заметили?\n' +
                '• Критичность проблемы',
                { parse_mode: 'Markdown' }
            );

        } catch (error) {
            logger.error('Error reporting problem:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при создании отчёта о проблеме');
        }
    }

    async handleProblemReport(chatId, userId, text) {
        try {
            // Создаем задачу с высоким приоритетом
            const problemTask = await this.prisma.maintenanceTask.create({
                data: {
                    technicianId: parseInt(userId),
                    type: 'EMERGENCY',
                    status: 'PENDING',
                    priority: 'HIGH',
                    description: `ПРОБЛЕМА: ${text}`,
                    scheduledDate: new Date()
                }
            });

            await this.bot.sendMessage(chatId,
                `🚨 *Проблема зарегистрирована*\n\n` +
                `🆔 Номер: #${problemTask.id}\n` +
                `📝 Описание: ${text}\n` +
                `⚡ Приоритет: ВЫСОКИЙ\n\n` +
                `Менеджеры уведомлены!`,
                { parse_mode: 'Markdown' }
            );

            await this.fsmManager.setState(userId, STATES.TECHNICIAN_MENU);

            // Уведомляем менеджеров
            await this.sendProblemNotification(problemTask, userId);

        } catch (error) {
            logger.error('Error handling problem report:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при сохранении отчёта о проблеме');
        }
    }

    async sendProblemNotification(task, technicianId) {
        try {
            const managers = await this.prisma.user.findMany({
                where: {
                    role: { name: 'MANAGER' },
                    telegramId: { not: null }
                }
            });

            const message = 
                `🚨 *ПРОБЛЕМА!*\n\n` +
                `👨‍🔧 Техник: ${technicianId}\n` +
                `🆔 Задача: #${task.id}\n` +
                `📝 ${task.description}\n` +
                `⏰ ${new Date().toLocaleString('ru-RU')}\n\n` +
                `⚡ Требует немедленного внимания!`;

            for (const manager of managers) {
                try {
                    await this.bot.sendMessage(manager.telegramId, message, {
                        parse_mode: 'Markdown'
                    });
                } catch (error) {
                    logger.warn(`Failed to send problem notification to manager ${manager.id}:`, error);
                }
            }

        } catch (error) {
            logger.error('Error sending problem notification:', error);
        }
    }
}

module.exports = { TechnicianHandler };
