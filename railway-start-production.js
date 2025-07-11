#!/usr/bin/env node

/**
 * VHM24 Railway Production Starter
 * Оптимизированный запуск для Railway с мониторингом 24/7
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Конфигурация
const CONFIG = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
  LOG_LEVEL: process.env.LOG_LEVEL || 'INFO'
};

// Логирование
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data,
    railway_project: CONFIG.RAILWAY_PROJECT_ID
  };
  console.log(JSON.stringify(logEntry));
}

// Создание необходимых директорий
function createDirectories() {
  const dirs = [
    'logs',
    'uploads',
    'temp',
    'backups'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log('INFO', `Created directory: ${dir}`);
    }
  });
}

// Проверка переменных окружения
function checkEnvironment() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REDIS_URL'
  ];

  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    log('ERROR', 'Missing required environment variables', { missing });
    process.exit(1);
  }

  log('INFO', 'Environment check passed', {
    node_env: CONFIG.NODE_ENV,
    port: CONFIG.PORT,
    railway_project: CONFIG.RAILWAY_PROJECT_ID
  });
}

// Запуск Backend API
function startBackend() {
  return new Promise((resolve, reject) => {
    log('INFO', 'Starting Backend API...');
    
    const backend = spawn('node', ['src/index.js'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    backend.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log('INFO', 'Backend stdout', { output });
      }
    });

    backend.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        log('ERROR', 'Backend stderr', { error });
      }
    });

    backend.on('close', (code) => {
      if (code === 0) {
        log('INFO', 'Backend started successfully');
        resolve(backend);
      } else {
        log('ERROR', 'Backend failed to start', { exit_code: code });
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    backend.on('error', (error) => {
      log('ERROR', 'Backend spawn error', { error: error.message });
      reject(error);
    });

    // Проверка готовности через 5 секунд
    setTimeout(() => {
      log('INFO', 'Backend startup timeout reached, assuming success');
      resolve(backend);
    }, 5000);
  });
}

// Запуск Telegram Bot (опционально)
function startTelegramBot() {
  return new Promise((resolve) => {
    if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN.includes('dev-')) {
      log('WARN', 'Telegram bot disabled - no production token');
      resolve(null);
      return;
    }

    log('INFO', 'Starting Telegram Bot...');
    
    const bot = spawn('node', ['src/index.js'], {
      cwd: path.join(__dirname, 'apps', 'telegram-bot'),
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    bot.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log('INFO', 'Bot stdout', { output });
      }
    });

    bot.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error && !error.includes('ETELEGRAM')) {
        log('ERROR', 'Bot stderr', { error });
      }
    });

    bot.on('close', (code) => {
      log('WARN', 'Telegram bot stopped', { exit_code: code });
    });

    bot.on('error', (error) => {
      log('ERROR', 'Bot spawn error', { error: error.message });
    });

    setTimeout(() => {
      log('INFO', 'Telegram bot startup completed');
      resolve(bot);
    }, 3000);
  });
}

// Health check endpoint
function setupHealthCheck() {
  const http = require('http');
  
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'VHM24 Railway Production',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        railway_project: CONFIG.RAILWAY_PROJECT_ID
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  const healthPort = parseInt(CONFIG.PORT) + 1;
  healthServer.listen(healthPort, () => {
    log('INFO', `Health check server running on port ${healthPort}`);
  });
}

// Graceful shutdown
function setupGracefulShutdown(processes) {
  const shutdown = (signal) => {
    log('INFO', `Received ${signal}, shutting down gracefully...`);
    
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
      }
    });

    setTimeout(() => {
      log('INFO', 'Graceful shutdown completed');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Railway restart signal
}

// Мониторинг процессов
function monitorProcesses(processes) {
  setInterval(() => {
    const activeProcesses = processes.filter(proc => proc && !proc.killed).length;
    log('INFO', 'Process monitor', {
      active_processes: activeProcesses,
      memory_usage: process.memoryUsage(),
      uptime: process.uptime()
    });
  }, 60000); // Каждую минуту
}

// Главная функция
async function main() {
  try {
    log('INFO', '🚀 Starting VHM24 Railway Production');
    
    // Подготовка
    createDirectories();
    checkEnvironment();
    setupHealthCheck();
    
    // Запуск сервисов
    const processes = [];
    
    const backend = await startBackend();
    processes.push(backend);
    
    const bot = await startTelegramBot();
    if (bot) processes.push(bot);
    
    // Настройка мониторинга
    setupGracefulShutdown(processes);
    monitorProcesses(processes);
    
    log('INFO', '✅ VHM24 Railway Production started successfully', {
      services: processes.length,
      port: CONFIG.PORT
    });
    
    // Уведомление о готовности
    setTimeout(() => {
      log('INFO', '🎯 All services are ready and running');
    }, 10000);
    
  } catch (error) {
    log('ERROR', 'Failed to start VHM24', { error: error.message });
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };
