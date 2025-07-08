# ✅ Чек-лист для исправления VHM24 на Railway

## Текущее состояние
- ✅ Gateway работает
- ❌ База данных не подключена
- ❌ Все микросервисы offline

## Что нужно сделать ПРЯМО СЕЙЧАС

### 1. Установите переменные окружения в Railway Dashboard

Откройте https://railway.app/dashboard и добавьте эти переменные:

```env
# ОБЯЗАТЕЛЬНЫЕ переменные (замените на ваши значения)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key...
NODE_ENV=production
```

### 2. Сделайте commit и push

```bash
git add .
git commit -m "Fix Railway deployment - use single process mode"
git push origin main
```

### 3. Дождитесь деплоя (2-3 минуты)

Railway автоматически передеплоит приложение.

### 4. Проверьте результат

```bash
node test-railway-api.js
```

## Что мы уже сделали

✅ Создали `railway-start.js` - правильный файл запуска
✅ Обновили `package.json` - использует новый start скрипт
✅ Создали документацию и тесты
✅ Подготовили все необходимые файлы

## Осталось только

1. **Добавить переменные окружения в Railway**
2. **Сделать git push**
3. **Подождать 2-3 минуты**

## Если после этого не работает

### Проблема с БД
- Проверьте что Supabase проект активен
- Убедитесь что пароль в DATABASE_URL правильный
- Попробуйте подключиться к БД локально с этими же данными

### Проблема с сервисами
- Посмотрите логи: `railway logs`
- Проверьте что все npm пакеты установлены
- Убедитесь что нет ошибок при старте

## Контакты Supabase для DATABASE_URL

1. Войдите в https://app.supabase.com
2. Выберите ваш проект
3. Settings → Database
4. Connection string → URI
5. Скопируйте и вставьте пароль

---

**Это все что нужно сделать!** Добавьте переменные и сделайте push. 🚀
