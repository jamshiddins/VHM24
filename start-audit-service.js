#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Запуск сервиса аудита VHM24...\n');

// Путь к сервису аудита
const auditServicePath = path.join(__dirname, 'services', 'audit');

// Установка зависимостей если нужно
console.log('📦 Проверка зависимостей сервиса аудита...');
const installProcess = spawn('npm', ['install'], {
  cwd: auditServicePath,
  stdio: 'inherit',
  shell: true
});

installProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Ошибка при установке зависимостей сервиса аудита');
    process.exit(1);
  }

  console.log('✅ Зависимости установлены');
  console.log('🚀 Запуск сервиса аудита...\n');

  // Запуск сервиса аудита
  const auditProcess = spawn('npm', ['start'], {
    cwd: auditServicePath,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      AUDIT_SERVICE_PORT: process.env.AUDIT_SERVICE_PORT || '3009',
      AUDIT_SERVICE_URL: process.env.AUDIT_SERVICE_URL || 'http://localhost:3009',
      AUDIT_RETENTION_DAYS: process.env.AUDIT_RETENTION_DAYS || '90',
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });

  auditProcess.on('close', (code) => {
    console.log(`\n🔍 Сервис аудита завершен с кодом ${code}`);
  });

  auditProcess.on('error', (error) => {
    console.error('❌ Ошибка запуска сервиса аудита:', error);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Остановка сервиса аудита...');
    auditProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Остановка сервиса аудита...');
    auditProcess.kill('SIGTERM');
  });
});

installProcess.on('error', (error) => {
  console.error('❌ Ошибка при установке зависимостей:', error);
  process.exit(1);
});
