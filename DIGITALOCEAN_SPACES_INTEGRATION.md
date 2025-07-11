# DigitalOcean Spaces Integration для VHM24

## 📋 Обзор

Интеграция DigitalOcean Spaces в Telegram-бот VHM24 для загрузки и хранения файлов (фото, документы,
отчеты) в облачном хранилище.

## 🔧 Настройка

### 1. Конфигурация DigitalOcean Spaces

**Данные для подключения:**

- **Space Name**: `vhm24-uploads`
- **Endpoint**: `https://fra1.digitaloceanspaces.com`
- **Region**: `fra1`
- **Access Key**: `DO00XEB6BC6XZ8Q2M4KQ`
- **Secret Key**: `SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk`
- **CDN URL**: `https://vhm24-uploads.fra1.cdn.digitaloceanspaces.com`

### 2. Переменные окружения

Добавьте в `.env` файл:

```env
# DigitalOcean Spaces Configuration
S3_ENDPOINT=https://fra1.digitaloceanspaces.com
S3_BUCKET=vhm24-uploads
S3_REGION=fra1
S3_ACCESS_KEY=DO00XEB6BC6XZ8Q2M4KQ
S3_SECRET_KEY=SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk
```

### 3. Установленные зависимости

```json
{
  "aws-sdk": "^2.1691.0",
  "uuid": "^9.0.1"
}
```

## 🚀 Функциональность

### Команды Telegram-бота

| Команда            | Описание                      |
| ------------------ | ----------------------------- |
| `/upload_photo`    | Помощь по загрузке фото       |
| `/upload_document` | Помощь по загрузке документов |
| `/my_uploads`      | Просмотр загруженных файлов   |
| `/upload_help`     | Справка по загрузке           |

### Автоматическая обработка

- **Фото**: Автоматически загружаются при отправке
- **Документы**: Автоматически загружаются при отправке
- **Максимальный размер**: 20 МБ для документов

## 📁 Структура файлов в Space

```
vhm24-uploads/
├── photos/          # Фотографии из Telegram
├── documents/       # Документы из Telegram
├── reports/         # Сгенерированные отчеты
└── uploads/         # Общие загрузки
```

## 🔧 API модуля S3Storage

### Основные методы

```javascript
const s3Storage = require('./utils/s3Storage');

// Загрузка фото
const photoUrl = await s3Storage.uploadPhoto(filePath, fileName);

// Загрузка документа
const docUrl = await s3Storage.uploadDocument(filePath, fileName);

// Загрузка отчета
const reportUrl = await s3Storage.uploadReport(filePath, fileName);

// Удаление файла
const deleted = await s3Storage.deleteFile(fileUrl);

// Информация о файле
const info = await s3Storage.getFileInfo(fileUrl);
```

### Поддерживаемые форматы

**Изображения:**

- JPG/JPEG
- PNG
- GIF
- WebP

**Документы:**

- PDF
- DOC/DOCX
- XLS/XLSX
- TXT
- CSV
- JSON

## 📸 Использование в Telegram

### Загрузка фото

1. Отправьте команду `/upload_photo` для получения инструкций
2. Отправьте любое фото в чат
3. Бот автоматически загрузит фото в DigitalOcean Spaces
4. Получите публичную ссылку на фото

**Пример ответа:**

```
✅ Фото успешно загружено!

📎 Ссылка: https://vhm24-uploads.fra1.cdn.digitaloceanspaces.com/photos/uuid.jpg
📏 Размер: 245 КБ
🌐 CDN: DigitalOcean Spaces
📅 Дата: 10.01.2025, 06:12:00
```

### Загрузка документов

1. Отправьте команду `/upload_document` для получения инструкций
2. Отправьте документ как файл (не как фото)
3. Бот проверит размер (макс. 20 МБ)
4. Загрузит документ и вернет ссылку

**Пример ответа:**

```
✅ Документ успешно загружен!

📎 Ссылка: report.pdf
📏 Размер: 2.5 МБ (2560 КБ)
📄 Тип: application/pdf
🌐 CDN: DigitalOcean Spaces
📅 Дата: 10.01.2025, 06:12:00
```

## 🔒 Безопасность

### Настройки доступа

- **ACL**: `public-read` - файлы доступны по прямой ссылке
- **CORS**: Настроен для веб-доступа
- **CDN**: Включен для быстрой загрузки

### Уникальные имена файлов

- Используется UUID для предотвращения конфликтов
- Формат: `{uuid}_{originalName}.{ext}`
- Пример: `a1b2c3d4-e5f6-7890-abcd-ef1234567890_photo.jpg`

## 🧹 Управление файлами

### Автоматическая очистка

- Временные файлы удаляются через 1 час
- Очистка запускается каждый час
- Логирование всех операций

### Кэширование

- **Cache-Control**: `max-age=31536000` (1 год)
- CDN кэширование включено
- Оптимизация для быстрой загрузки

## 📊 Мониторинг

### Логирование

```javascript
// Успешная загрузка
console.log(`✅ File uploaded successfully: ${cdnUrl}`);

// Ошибка загрузки
console.error('❌ Error uploading file to S3:', error);

// Очистка временных файлов
console.log(`🗑️ Cleaned up temp file: ${file}`);
```

### Метрики

- Количество загруженных файлов
- Размер загруженных файлов
- Ошибки загрузки
- Время обработки

## 🚀 Развертывание

### Railway

Переменные окружения автоматически подтягиваются из `.env` файла при развертывании на Railway.

### Локальная разработка

1. Скопируйте `.env.example` в `.env`
2. Заполните переменные DigitalOcean Spaces
3. Запустите Telegram-бот: `npm run dev`

## 🔧 Расширение функциональности

### Планируемые улучшения

1. **База данных файлов**
   - История загрузок пользователей
   - Метаданные файлов
   - Поиск по файлам

2. **Управление файлами**
   - Удаление файлов через бот
   - Создание альбомов
   - Массовые операции

3. **Интеграция с системой**
   - Привязка файлов к задачам
   - Автоматические отчеты
   - Резервное копирование

### Дополнительные возможности

```javascript
// Создание подписанного URL (временный доступ)
const signedUrl = s3Storage.getSignedUrl(key, 3600); // 1 час

// Получение информации о файле
const fileInfo = await s3Storage.getFileInfo(fileUrl);
console.log(fileInfo.size, fileInfo.contentType);
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте переменные окружения
2. Убедитесь в правильности Access Key и Secret Key
3. Проверьте логи Telegram-бота
4. Обратитесь к документации DigitalOcean Spaces

## ✅ Статус интеграции

- ✅ Модуль S3Storage создан
- ✅ Обработчик загрузки интегрирован
- ✅ Команды Telegram-бота добавлены
- ✅ Автоматическая обработка фото/документов
- ✅ Переменные окружения настроены
- ✅ Документация создана

**Интеграция DigitalOcean Spaces полностью готова к использованию!**
