require('dotenv').config();

const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    options: {
      polling: true
    },
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL
  },
  
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
  },
  
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:8000/api/v1',
    timeout: 30000
  }
};

module.exports = config;
