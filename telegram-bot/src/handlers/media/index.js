const { Markup } = require('telegraf');
const { BOT_STATES } = require('../../fsm/states');
const apiService = require('../../services/api');
const logger = require('../../utils/logger');

/**
 * Регистрирует обработчики для медиа-контента
 * @param {Object} bot - Экземпляр бота Telegraf
 * @param {Function} requireRole - Функция для проверки роли
 */
const register = (bot, requireRole) => {
  // Обработчик для просмотра медиа-контента
  bot.action('view_media', requireRole(['ADMIN', 'MANAGER']), async (ctx) => {
    try {
      await viewMediaHandler(ctx);
    } catch (error) {
      logger.error('Error in view_media action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для просмотра деталей медиа
  bot.action(/^media_item_(\d+)$/, requireRole(['ADMIN', 'MANAGER']), async (ctx) => {
    try {
      await viewMediaDetailsHandler(ctx);
    } catch (error) {
      logger.error('Error in media_item details action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для добавления медиа
  bot.action('add_media', requireRole(['ADMIN', 'MANAGER']), async (ctx) => {
    try {
      await addMediaHandler(ctx);
    } catch (error) {
      logger.error('Error in add_media action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для активации медиа
  bot.action(/^media_activate_(\d+)$/, requireRole(['ADMIN', 'MANAGER']), async (ctx) => {
    try {
      const mediaId = ctx.match[1];
      
      // В режиме разработки имитируем успешное обновление
      await ctx.reply('✅ Медиа успешно активировано');
      
      // Возвращаемся к деталям медиа
      await viewMediaDetailsHandler({
        ...ctx,
        callbackQuery: {
          ...ctx.callbackQuery,
          data: `media_item_${mediaId}`
        }
      });
      
      logger.info(`User ${ctx.from.id} activated media ${mediaId}`);
    } catch (error) {
      logger.error('Error in media_activate action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для деактивации медиа
  bot.action(/^media_deactivate_(\d+)$/, requireRole(['ADMIN', 'MANAGER']), async (ctx) => {
    try {
      const mediaId = ctx.match[1];
      
      // В режиме разработки имитируем успешное обновление
      await ctx.reply('✅ Медиа успешно деактивировано');
      
      // Возвращаемся к деталям медиа
      await viewMediaDetailsHandler({
        ...ctx,
        callbackQuery: {
          ...ctx.callbackQuery,
          data: `media_item_${mediaId}`
        }
      });
      
      logger.info(`User ${ctx.from.id} deactivated media ${mediaId}`);
    } catch (error) {
      logger.error('Error in media_deactivate action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для редактирования медиа
  bot.action(/^media_edit_(\d+)$/, requireRole(['ADMIN', 'MANAGER']), async (ctx) => {
    try {
      const mediaId = ctx.match[1];
      
      // Сохраняем ID медиа в сессии
      if (ctx.session) {
        ctx.session.editMediaId = mediaId;
      }
      
      // Создаем клавиатуру для выбора поля для редактирования
      const keyboard = [
        [
          Markup.button.callback('Название', `edit_media_title_${mediaId}`),
          Markup.button.callback('Описание', `edit_media_description_${mediaId}`)
        ],
        [Markup.button.callback('🔙 Назад', `media_item_${mediaId}`)]
      ];
      
      await ctx.reply('Выберите поле для редактирования:', Markup.inlineKeyboard(keyboard));
      
      logger.info(`User ${ctx.from.id} is editing media ${mediaId}`);
    } catch (error) {
      logger.error('Error in media_edit action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для удаления медиа
  bot.action(/^media_delete_(\d+)$/, requireRole(['ADMIN', 'MANAGER']), async (ctx) => {
    try {
      const mediaId = ctx.match[1];
      
      // Создаем клавиатуру для подтверждения удаления
      const keyboard = [
        [
          Markup.button.callback('✅ Да, удалить', `confirm_delete_media_${mediaId}`),
          Markup.button.callback('❌ Нет, отменить', `media_item_${mediaId}`)
        ]
      ];
      
      await ctx.reply('Вы уверены, что хотите удалить это медиа?', Markup.inlineKeyboard(keyboard));
      
      logger.info(`User ${ctx.from.id} is attempting to delete media ${mediaId}`);
    } catch (error) {
      logger.error('Error in media_delete action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  logger.info('Media handlers registered');
};

// Обработчик для просмотра медиа-контента
const viewMediaHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const mediaItems = [
      { id: '1', type: 'image', title: 'Рекламный баннер 1', url: 'https://example.com/banner1.jpg', status: 'ACTIVE' },
      { id: '2', type: 'video', title: 'Промо-ролик', url: 'https://example.com/promo.mp4', status: 'ACTIVE' },
      { id: '3', type: 'image', title: 'Акционное предложение', url: 'https://example.com/offer.jpg', status: 'INACTIVE' }
    ];
    
    if (!mediaItems || mediaItems.length === 0) {
      await ctx.reply('📋 В системе нет медиа-контента.');
      return;
    }
    
    // Формируем сообщение со списком медиа
    let message = '📋 *Доступный медиа-контент:*\n\n';
    
    mediaItems.forEach((item, index) => {
      const status = getStatusText(item.status);
      
      message += `*${index + 1}. ${item.title}*\n`;
      message += `📍 Тип: ${getMediaTypeText(item.type)}\n`;
      message += `🔄 Статус: ${status}\n\n`;
    });
    
    // Создаем клавиатуру для выбора медиа
    const keyboard = mediaItems.map((item, index) => [
      Markup.button.callback(`${index + 1}. ${item.title}`, `media_item_${item.id}`)
    ]);
    
    // Добавляем кнопку добавления нового медиа и возврата в меню
    keyboard.push([
      Markup.button.callback('➕ Добавить медиа', 'add_media')
    ]);
    keyboard.push([
      Markup.button.callback('🔙 Назад в меню', 'back_to_menu')
    ]);
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.MEDIA_LIST);
    }
    
    logger.info(`User ${ctx.from.id} viewed media list`);
  } catch (error) {
    logger.error('Error in view media handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении списка медиа. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для просмотра деталей медиа
const viewMediaDetailsHandler = async (ctx) => {
  try {
    // Получаем ID медиа из callback_data
    const mediaId = ctx.callbackQuery.data.split('_')[2];
    
    // В режиме разработки используем мок-данные
    const mediaItems = [
      { id: '1', type: 'image', title: 'Рекламный баннер 1', url: 'https://example.com/banner1.jpg', status: 'ACTIVE', description: 'Баннер для главного экрана', dimensions: '1920x1080', createdAt: '2025-07-01' },
      { id: '2', type: 'video', title: 'Промо-ролик', url: 'https://example.com/promo.mp4', status: 'ACTIVE', description: 'Видеоролик о новых продуктах', duration: '00:30', createdAt: '2025-07-05' },
      { id: '3', type: 'image', title: 'Акционное предложение', url: 'https://example.com/offer.jpg', status: 'INACTIVE', description: 'Баннер для акции', dimensions: '1200x800', createdAt: '2025-07-10' }
    ];
    
    // Находим нужное медиа
    const media = mediaItems.find(m => m.id === mediaId);
    
    if (!media) {
      await ctx.reply('❌ Медиа не найдено.');
      return;
    }
    
    // Формируем сообщение с деталями медиа
    let message = `📋 *Детали медиа #${media.id}*\n\n`;
    message += `*Название:* ${media.title}\n`;
    message += `*Тип:* ${getMediaTypeText(media.type)}\n`;
    message += `*Статус:* ${getStatusText(media.status)}\n`;
    message += `*Описание:* ${media.description}\n`;
    message += `*URL:* ${media.url}\n`;
    
    if (media.type === 'image') {
      message += `*Размеры:* ${media.dimensions}\n`;
    } else if (media.type === 'video') {
      message += `*Длительность:* ${media.duration}\n`;
    }
    
    message += `*Создано:* ${new Date(media.createdAt).toLocaleDateString('ru-RU')}\n`;
    
    // Создаем клавиатуру с действиями
    const keyboard = [
      [
        Markup.button.callback('✅ Активировать', `media_activate_${media.id}`),
        Markup.button.callback('❌ Деактивировать', `media_deactivate_${media.id}`)
      ],
      [
        Markup.button.callback('🖊 Редактировать', `media_edit_${media.id}`),
        Markup.button.callback('🗑 Удалить', `media_delete_${media.id}`)
      ],
      [Markup.button.callback('🔙 Назад к списку', 'view_media')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} viewed media details for media ${mediaId}`);
  } catch (error) {
    logger.error('Error in view media details handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении деталей медиа. Пожалуйста, попробуйте позже.');
  }
};

// Вспомогательная функция для получения текстового представления типа медиа
const getMediaTypeText = (type) => {
  const typeMap = {
    'image': '🖼 Изображение',
    'video': '🎬 Видео',
    'audio': '🔊 Аудио'
  };
  
  return typeMap[type] || type;
};

// Вспомогательная функция для получения текстового представления статуса
const getStatusText = (status) => {
  const statusMap = {
    'ACTIVE': '✅ Активно',
    'INACTIVE': '❌ Неактивно',
    'PENDING': '⏳ В ожидании'
  };
  
  return statusMap[status] || status;
};

/**
 * Обработчик для добавления медиа
 * @param {Object} ctx - Контекст Telegraf
 */
const addMediaHandler = async (ctx) => {
  try {
    // Создаем клавиатуру для выбора типа медиа
    const keyboard = [
      [
        Markup.button.callback('🖼 Изображение', 'add_media_image'),
        Markup.button.callback('🎬 Видео', 'add_media_video')
      ],
      [
        Markup.button.callback('🔊 Аудио', 'add_media_audio'),
        Markup.button.callback('📄 Документ', 'add_media_document')
      ],
      [Markup.button.callback('🔙 Назад', 'view_media')]
    ];
    
    await ctx.reply('Выберите тип медиа для добавления:', Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.MEDIA_ADD);
    }
    
    logger.info(`User ${ctx.from.id} is adding media`);
  } catch (error) {
    logger.error('Error in add media handler:', error);
    await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

module.exports = {
  viewMediaHandler,
  viewMediaDetailsHandler,
  addMediaHandler,
  register
};
