# VHM24 VendHub Management System

## Railway Deployment

### Настройки деплоя
- Start command: `npm run start`
- Public URL: `https://vhm24-1-0.up.railway.app`
- Webhook: `${RAILWAY_PUBLIC_URL}/api/bot`

### Локальный запуск

```bash
npm install
npm start
```

### Деплой на Railway

```bash
railway up
```

### Проверка статуса

```bash
railway status
railway logs
```

### Важные настройки в Railway Dashboard

1. Откройте Railway Dashboard: https://railway.app/project/740ca318-2ca1-49bb-8827-75feb0a5639c
2. Перейдите в Web Service → Settings
3. Убедитесь что:
   - Service Type: Web (exposes HTTP port)
   - Start Command: npm run start
   - Health Check Path: /health
