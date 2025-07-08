/**
 * VHM24 Platform - Railway Entry Point
 * This file starts all services for Railway deployment
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 VHM24 Platform starting on Railway...');
console.log('Project ID:', process.env.RAILWAY_PROJECT_ID || 'local');
console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'development');

// Services configuration
const services = [
  {
    name: 'Gateway',
    path: './services/gateway/src/index.js',
    port: process.env.GATEWAY_PORT || 8000,
    env: { PORT: process.env.GATEWAY_PORT || 8000 }
  },
  {
    name: 'Auth',
    path: './services/auth/src/index.js',
    port: process.env.AUTH_PORT || 3001,
    env: { PORT: process.env.AUTH_PORT || 3001 }
  },
  {
    name: 'Machines',
    path: './services/machines/src/index.js',
    port: process.env.MACHINES_PORT || 3002,
    env: { PORT: process.env.MACHINES_PORT || 3002 }
  },
  {
    name: 'Inventory',
    path: './services/inventory/src/index.js',
    port: process.env.INVENTORY_PORT || 3003,
    env: { PORT: process.env.INVENTORY_PORT || 3003 }
  },
  {
    name: 'Tasks',
    path: './services/tasks/src/index.js',
    port: process.env.TASKS_PORT || 3004,
    env: { PORT: process.env.TASKS_PORT || 3004 }
  },
  {
    name: 'Bunkers',
    path: './services/bunkers/src/index.js',
    port: process.env.BUNKERS_PORT || 3005,
    env: { PORT: process.env.BUNKERS_PORT || 3005 }
  }
];

// Start Telegram Bot if token is provided
if (process.env.TELEGRAM_BOT_TOKEN) {
  services.push({
    name: 'Telegram Bot',
    path: './services/telegram-bot/src/index.js',
    env: {}
  });
}

// Function to start a service
function startService(service) {
  console.log(`Starting ${service.name} service...`);
  
  const child = spawn('node', [service.path], {
    env: { ...process.env, ...service.env },
    stdio: 'inherit'
  });

  child.on('error', (error) => {
    console.error(`Error starting ${service.name}:`, error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${service.name} exited with code ${code}`);
      process.exit(code);
    }
  });

  return child;
}

// Start all services
const processes = [];

// Add delay between service starts to avoid port conflicts
async function startAllServices() {
  for (const service of services) {
    const child = startService(service);
    processes.push(child);
    
    // Wait 2 seconds between service starts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ All services started successfully!');
  console.log('\n📍 Service URLs:');
  console.log(`Gateway: ${process.env.RAILWAY_STATIC_URL || 'http://localhost:8000'}`);
  console.log(`Health: ${process.env.RAILWAY_STATIC_URL || 'http://localhost:8000'}/health`);
  console.log(`API: ${process.env.RAILWAY_STATIC_URL || 'http://localhost:8000'}/api/v1`);
  
  if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log('\n🤖 Telegram Bot is active');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down services...');
  processes.forEach(child => {
    child.kill('SIGTERM');
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  processes.forEach(child => {
    child.kill('SIGTERM');
  });
  process.exit(0);
});

// Start services
startAllServices().catch(error => {
  console.error('Failed to start services:', error);
  process.exit(1);
});
