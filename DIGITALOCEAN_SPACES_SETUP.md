# 🌊 DigitalOcean Spaces Setup для VHM24

## 📋 Что нужно от DigitalOcean

### 1. DigitalOcean Spaces (S3-совместимое хранилище)
- **Назначение**: Замена MinIO для хранения файлов (изображения, документы, бэкапы)
- **Стоимость**: $5/месяц за 250GB + $0.02/GB за трафик
- **Регионы**: Рекомендуется Frankfurt (fra1) или Amsterdam (ams3) для лучшей скорости

## 🚀 Пошаговая настройка

### Шаг 1: Создание DigitalOcean Spaces

1. **Войдите в DigitalOcean Dashboard**
   - Перейдите на https://cloud.digitalocean.com/
   - Войдите в свой аккаунт

2. **Создайте Spaces**
   ```
   Spaces → Create a Space
   
   Настройки:
   - Datacenter region: Frankfurt (fra1) или Amsterdam (ams3)
   - Enable CDN: Yes (для быстрой загрузки файлов)
   - Space name: vhm24-uploads
   - File Listing: Restricted (для безопасности)
   ```

3. **Создайте второй Space для бэкапов**
   ```
   Настройки:
   - Datacenter region: тот же что и основной
   - Enable CDN: No (не нужно для бэкапов)
   - Space name: vhm24-backups
   - File Listing: Restricted
   ```

### Шаг 2: Создание API ключей

1. **Перейдите в API раздел**
   ```
   API → Spaces access keys → Generate New Key
   
   Name: VHM24 Production
   ```

2. **Сохраните ключи** (показываются только один раз!)
   ```
   Access Key ID: AKIA... (20 символов)
   Secret Access Key: ... (40 символов)
   ```

### Шаг 3: Настройка CORS для Spaces

1. **Откройте vhm24-uploads Space**
2. **Перейдите в Settings → CORS**
3. **Добавьте CORS правило:**
   ```json
   {
     "AllowedOrigins": [
       "https://your-app.railway.app",
       "https://your-dashboard.railway.app",
       "http://localhost:3000",
       "http://localhost:8000"
     ],
     "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3000
   }
   ```

## 🔧 Настройка переменных в Railway

После создания Spaces выполните:

```bash
# Основные Spaces переменные
railway variables set S3_ENDPOINT="https://fra1.digitaloceanspaces.com"
railway variables set S3_BUCKET="vhm24-uploads"
railway variables set S3_ACCESS_KEY="YOUR_ACCESS_KEY_HERE"
railway variables set S3_SECRET_KEY="YOUR_SECRET_KEY_HERE"
railway variables set S3_REGION="fra1"

# Для бэкапов
railway variables set BACKUP_S3_BUCKET="vhm24-backups"
railway variables set BACKUP_S3_ACCESS_KEY="YOUR_ACCESS_KEY_HERE"
railway variables set BACKUP_S3_SECRET_KEY="YOUR_SECRET_KEY_HERE"
railway variables set BACKUP_S3_ENDPOINT="https://fra1.digitaloceanspaces.com"

# CDN URL (опционально, для быстрой загрузки)
railway variables set S3_CDN_URL="https://vhm24-uploads.fra1.cdn.digitaloceanspaces.com"
```

## 📁 Структура файлов в Spaces

### vhm24-uploads (основное хранилище)
```
/uploads/
  /images/
    /machines/     # Фото вендинговых автоматов
    /products/     # Фото товаров
    /users/        # Аватары пользователей
  /documents/
    /reports/      # Отчеты
    /invoices/     # Счета
  /temp/           # Временные файлы
```

### vhm24-backups (бэкапы)
```
/database/
  /daily/          # Ежедневные бэкапы БД
  /weekly/         # Еженедельные бэкапы
/logs/
  /application/    # Логи приложения
  /system/         # Системные логи
```

## 🔒 Настройка безопасности

### 1. Bucket Policy для vhm24-uploads
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::vhm24-uploads/uploads/images/*"
    },
    {
      "Sid": "DenyDirectAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::vhm24-uploads/uploads/documents/*"
    }
  ]
}
```

### 2. Bucket Policy для vhm24-backups
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::vhm24-backups",
        "arn:aws:s3:::vhm24-backups/*"
      ]
    }
  ]
}
```

## 🧪 Тестирование Spaces

Создайте тестовый скрипт:

```javascript
// test-spaces.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: 'https://fra1.digitaloceanspaces.com',
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'fra1'
});

// Тест загрузки файла
async function testUpload() {
  try {
    const result = await s3.upload({
      Bucket: 'vhm24-uploads',
      Key: 'test/test-file.txt',
      Body: 'Hello from VHM24!',
      ContentType: 'text/plain',
      ACL: 'public-read'
    }).promise();
    
    console.log('✅ Upload successful:', result.Location);
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

testUpload();
```

## 💰 Оптимизация расходов

### 1. Lifecycle правила
```json
{
  "Rules": [
    {
      "ID": "DeleteTempFiles",
      "Status": "Enabled",
      "Filter": {"Prefix": "temp/"},
      "Expiration": {"Days": 7}
    },
    {
      "ID": "ArchiveOldBackups",
      "Status": "Enabled",
      "Filter": {"Prefix": "database/daily/"},
      "Expiration": {"Days": 30}
    }
  ]
}
```

### 2. Мониторинг использования
- Настройте алерты в DigitalOcean для контроля расходов
- Регулярно очищайте временные файлы
- Используйте сжатие для бэкапов

## 🚀 Финальный деплой

После настройки Spaces:

```bash
# 1. Проверьте переменные окружения
railway variables

# 2. Установите сервис для деплоя
railway variables set RAILWAY_SERVICE_NAME="gateway"

# 3. Запустите деплой
railway up

# 4. Проверьте логи
railway logs

# 5. Получите URL приложения
railway domain
```

## 🔍 Проверка работы

1. **Проверьте health endpoint:**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **Проверьте загрузку файлов:**
   ```bash
   curl -X POST https://your-app.railway.app/api/v1/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test-image.jpg"
   ```

3. **Проверьте Spaces в DigitalOcean Dashboard**

## ⚠️ Важные замечания

1. **Регион**: Выберите ближайший к вашим пользователям
2. **CDN**: Обязательно включите для лучшей производительности
3. **Бэкапы**: Настройте автоматические бэкапы БД в Spaces
4. **Мониторинг**: Следите за использованием трафика и хранилища
5. **Безопасность**: Никогда не делайте bucket полностью публичным

## 📞 Поддержка

- **DigitalOcean Docs**: https://docs.digitalocean.com/products/spaces/
- **AWS S3 API**: https://docs.aws.amazon.com/s3/
- **Railway Support**: https://help.railway.app/

---

После выполнения всех шагов ваш VHM24 будет полностью готов к production использованию на Railway с DigitalOcean Spaces!
