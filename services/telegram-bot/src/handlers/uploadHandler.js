const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const os = require('os');
const s3Storage = require('../utils/s3Storage');

/**
 * Upload Handler - обработчик загрузки файлов
 * Поддерживает загрузку фото, документов и других файлов в DigitalOcean Spaces
 */

class UploadHandler {
  constructor(bot) {
    this.bot = bot;
    this.tempDir = path.join(os.tmpdir(), 'vhm24-uploads');
    
    // Создаем временную директорию если её нет
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    this.setupHandlers();
  }

  setupHandlers() {
    // Команда для загрузки фото
    this.bot.onText(/\/upload_photo/, (msg) => {
      this.handleUploadPhotoCommand(msg);
    });

    // Команда для загрузки документа
    this.bot.onText(/\/upload_document/, (msg) => {
      this.handleUploadDocumentCommand(msg);
    });

    // Обработка фото
    this.bot.on('photo', (msg) => {
      this.handlePhoto(msg);
    });

    // Обработка документов
    this.bot.on('document', (msg) => {
      this.handleDocument(msg);
    });

    // Команда для просмотра загруженных файлов
    this.bot.onText(/\/my_uploads/, (msg) => {
      this.handleMyUploads(msg);
    });

    // Команда помощи по загрузке
    this.bot.onText(/\/upload_help/, (msg) => {
      this.handleUploadHelp(msg);
    });
  }

  /**
   * Обработка команды /upload_photo
   */
  async handleUploadPhotoCommand(msg) {
    const chatId = msg.chat.id;
    
    const helpText = `📸 *Загрузка фото в облако*

Просто пришлите мне фото, и я загружу его в DigitalOcean Spaces!

*Поддерживаемые форматы:*
• JPG/JPEG
• PNG
• GIF
• WebP

*Что происходит:*
1. Вы отправляете фото
2. Я загружаю его в облако
3. Вы получаете публичную ссылку

Попробуйте прямо сейчас - отправьте любое фото! 📷`;

    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  /**
   * Обработка команды /upload_document
   */
  async handleUploadDocumentCommand(msg) {
    const chatId = msg.chat.id;
    
    const helpText = `📄 *Загрузка документов в облако*

Отправьте мне документ, и я загружу его в DigitalOcean Spaces!

*Поддерживаемые форматы:*
• PDF
• DOC/DOCX
• XLS/XLSX
• TXT
• CSV
• И многие другие

*Максимальный размер:* 20 МБ

Попробуйте прямо сейчас - отправьте любой документ! 📎`;

    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  /**
   * Обработка фото
   */
  async handlePhoto(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    try {
      // Отправляем сообщение о начале загрузки
      const statusMsg = await this.bot.sendMessage(chatId, '📸 Загружаю фото в облако...', {
        reply_to_message_id: messageId
      });

      // Получаем фото наилучшего качества
      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;

      // Получаем информацию о файле
      const file = await this.bot.getFile(fileId);
      const fileName = `photo_${Date.now()}.jpg`;
      const tempFilePath = path.join(this.tempDir, fileName);

      // Скачиваем файл
      await this.bot.downloadFile(fileId, tempFilePath);

      // Загружаем в DigitalOcean Spaces
      const uploadedUrl = await s3Storage.uploadPhoto(tempFilePath, fileName);

      // Получаем информацию о файле
      const stats = fs.statSync(tempFilePath);
      const fileSizeKB = Math.round(stats.size / 1024);

      // Удаляем временный файл
      fs.unlinkSync(tempFilePath);

      // Обновляем сообщение с результатом
      const successText = `✅ *Фото успешно загружено!*

📎 *Ссылка:* [Открыть фото](${uploadedUrl})
📏 *Размер:* ${fileSizeKB} КБ
🌐 *CDN:* DigitalOcean Spaces
📅 *Дата:* ${new Date().toLocaleString('ru-RU')}

_Ссылка публичная и будет работать всегда_`;

      await this.bot.editMessageText(successText, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });

      // Логируем успешную загрузку
      console.log(`✅ Photo uploaded by user ${msg.from.id}: ${uploadedUrl}`);

    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      
      await this.bot.sendMessage(chatId, `❌ Ошибка при загрузке фото: ${error.message}`, {
        reply_to_message_id: messageId
      });
    }
  }

  /**
   * Обработка документов
   */
  async handleDocument(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    try {
      const document = msg.document;
      const fileId = document.file_id;
      const fileName = document.file_name || `document_${Date.now()}`;
      const fileSize = document.file_size;

      // Проверяем размер файла (максимум 20 МБ)
      if (fileSize > 20 * 1024 * 1024) {
        await this.bot.sendMessage(chatId, '❌ Файл слишком большой! Максимальный размер: 20 МБ', {
          reply_to_message_id: messageId
        });
        return;
      }

      // Отправляем сообщение о начале загрузки
      const statusMsg = await this.bot.sendMessage(chatId, `📄 Загружаю документ "${fileName}" в облако...`, {
        reply_to_message_id: messageId
      });

      // Скачиваем файл
      const tempFilePath = path.join(this.tempDir, fileName);
      await this.bot.downloadFile(fileId, tempFilePath);

      // Загружаем в DigitalOcean Spaces
      const uploadedUrl = await s3Storage.uploadDocument(tempFilePath, fileName);

      // Получаем информацию о файле
      const fileSizeKB = Math.round(fileSize / 1024);
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

      // Удаляем временный файл
      fs.unlinkSync(tempFilePath);

      // Обновляем сообщение с результатом
      const successText = `✅ *Документ успешно загружен!*

📎 *Ссылка:* [${fileName}](${uploadedUrl})
📏 *Размер:* ${fileSizeMB} МБ (${fileSizeKB} КБ)
📄 *Тип:* ${document.mime_type || 'неизвестно'}
🌐 *CDN:* DigitalOcean Spaces
📅 *Дата:* ${new Date().toLocaleString('ru-RU')}

_Ссылка публичная и будет работать всегда_`;

      await this.bot.editMessageText(successText, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });

      // Логируем успешную загрузку
      console.log(`✅ Document uploaded by user ${msg.from.id}: ${uploadedUrl}`);

    } catch (error) {
      console.error('❌ Error uploading document:', error);
      
      await this.bot.sendMessage(chatId, `❌ Ошибка при загрузке документа: ${error.message}`, {
        reply_to_message_id: messageId
      });
    }
  }

  /**
   * Обработка команды /my_uploads
   */
  async handleMyUploads(msg) {
    const chatId = msg.chat.id;
    
    const infoText = `📁 *Мои загрузки*

К сожалению, пока нет базы данных для отслеживания ваших загрузок.

*Что можно сделать:*
• Сохраняйте ссылки на важные файлы
• Используйте закладки в браузере
• Создайте заметку с ссылками

*Планируется добавить:*
• История загрузок
• Управление файлами
• Создание альбомов
• Поиск по файлам

Пока что просто загружайте файлы - все ссылки публичные и постоянные! 🚀`;

    await this.bot.sendMessage(chatId, infoText, { parse_mode: 'Markdown' });
  }

  /**
   * Обработка команды /upload_help
   */
  async handleUploadHelp(msg) {
    const chatId = msg.chat.id;
    
    const helpText = `🆘 *Помощь по загрузке файлов*

*📸 Фото:*
• Просто отправьте фото
• Поддерживаются: JPG, PNG, GIF, WebP
• Автоматическая загрузка в облако

*📄 Документы:*
• Отправьте файл как документ
• Максимальный размер: 20 МБ
• Поддерживаются все форматы

*🌐 Облачное хранилище:*
• DigitalOcean Spaces
• CDN для быстрой загрузки
• Публичные ссылки
• Постоянное хранение

*📋 Команды:*
/upload_photo - помощь по фото
/upload_document - помощь по документам
/my_uploads - мои загрузки
/upload_help - эта справка

*🔧 Технические детали:*
• Уникальные имена файлов (UUID)
• Автоматическое определение MIME-типов
• Кэширование на 1 год
• Логирование всех операций

Просто отправьте файл и получите ссылку! 🚀`;

    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  /**
   * Очистка временных файлов
   */
  cleanupTempFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        // Удаляем файлы старше 1 часа
        if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned up temp file: ${file}`);
        }
      });
    } catch (error) {
      console.error('❌ Error cleaning up temp files:', error);
    }
  }
}

module.exports = UploadHandler;
