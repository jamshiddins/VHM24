# Railway Configuration

## Project Details
- **Name**: VHM24-1.0
- **ID**: 740ca318-2ca1-49bb-8827-75feb0a5639c
- **Environment**: production

## Used Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `RAILWAY_PUBLIC_URL`: Public application URL
- `TELEGRAM_BOT_TOKEN`: Telegram bot token
- `WEBHOOK_URL`: Telegram webhook endpoint
- `PORT`: Application port (8000)
- `NODE_ENV`: Environment (production)

## Services Configuration
- **Web Service**: Node.js application
- **PostgreSQL**: Database service
- **Redis**: Cache service

## Deployment
- Builder: nixpacks
- Start command: npm start
- Health check: /api/health
- Restart policy: always

Generated: 2025-07-14T20:02:48.445Z
