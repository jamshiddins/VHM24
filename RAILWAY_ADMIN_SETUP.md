# 🔐 Настройка админа в VHM24

## Проблемы:
1. База данных Supabase не доступна из Railway
2. API URL неправильный (`/api/v1` вместо полного URL)
3. Нет автоматической регистрации админа через Telegram

## 🚀 Решение 1: Проверьте Supabase

1. Откройте Supabase Dashboard
2. Settings → Database
3. Убедитесь что "Allow connections from anywhere" включено
4. Или добавьте Railway IP в whitelist

## 🚀 Решение 2: Исправьте переменные в Railway

```env
# ВАЖНО - добавьте полный URL!
API_URL=https://vhm24-production.up.railway.app/api/v1

# Или найдите ваш URL в Railway Settings → Domains
```

## 🚀 Решение 3: Создайте админа вручную

### Вариант A: Через миграции (рекомендуется)

1. Локально выполните:
```bash
# Убедитесь что .env настроен на Supabase
npm run db:migrate
npm run db:seed
```

2. Создайте файл `packages/database/src/seed.ts`:
```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vhm24.ru',
      name: 'Admin',
      passwordHash,
      roles: ['ADMIN'],
      telegramId: '42283329', // Ваш Telegram ID
      isActive: true
    }
  });
  
  console.log('Admin created:', admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

3. Запустите: `node packages/database/src/seed.js`

### Вариант B: Через Supabase UI

1. Откройте Supabase Dashboard
2. Table Editor → User
3. Insert Row:
   - email: `admin@vhm24.ru`
   - name: `Admin`
   - passwordHash: `$2b$10$YourHashHere` (используйте bcrypt generator)
   - roles: `["ADMIN"]`
   - telegramId: `42283329`
   - isActive: `true`

## 🤖 Использование Telegram Bot:

После создания админа:
1. `/start` - войти через Telegram ID
2. Бот автоматически авторизует вас как админа
3. Используйте команды бота

## ⚠️ Критически важно:

1. **API_URL** должен быть полным URL, не просто `/api/v1`
2. **DATABASE_URL** должен быть доступен из Railway
3. **telegramId** в базе должен совпадать с вашим

---
*Главное - создайте админа в базе данных и исправьте API_URL!*
