/**
 * VHM24 - Update Fastify Dependencies
 * 
 * Этот скрипт обновляет fastify и его плагины во всех сервисах
 * для обеспечения совместимости версий
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Список сервисов
const services = [
  'auth',
  'machines',
  'inventory',
  'tasks',
  'bunkers',
  'gateway'
];

// Зависимости для обновления
const dependencies = [
  'fastify@5.x',
  '@fastify/jwt@latest',
  '@fastify/cors@latest',
  '@fastify/helmet@latest',
  '@fastify/rate-limit@latest',
  '@fastify/swagger@latest'
];

console.log('🔄 Обновление зависимостей Fastify для всех сервисов...\n');

// Обновляем зависимости для каждого сервиса
services.forEach(service => {
  const servicePath = path.join(__dirname, 'services', service);
  
  // Проверяем существование директории сервиса
  if (!fs.existsSync(servicePath)) {
    console.log(`⚠️ Сервис ${service} не найден, пропускаем...`);
    return;
  }
  
  // Проверяем наличие package.json
  const packageJsonPath = path.join(servicePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️ package.json для сервиса ${service} не найден, пропускаем...`);
    return;
  }
  
  console.log(`\n📦 Обновление зависимостей для сервиса ${service}...`);
  
  try {
    // Устанавливаем зависимости
    const command = `cd ${servicePath} && npm install ${dependencies.join(' ')} --save`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Зависимости для сервиса ${service} успешно обновлены`);
  } catch (error) {
    console.error(`❌ Ошибка при обновлении зависимостей для сервиса ${service}:`, error.message);
  }
});

console.log('\n✅ Обновление зависимостей завершено!');
