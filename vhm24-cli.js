const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

const command = process.argv[2];
const API_URL = 'http://localhost:8000';

async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    const data = await response.json();
    logger.info(JSON.stringify(data, null, 2));
  } catch (error) {
    logger.error('Error:', error.message);
  }
}

async function main() {
  switch(command) {
    case 'health':
      await fetchAPI('/health');
      break;
    case 'stats':
      await fetchAPI('/api/v1/dashboard/stats');
      break;
    case 'tasks':
      await fetchAPI('/api/v1/tasks');
      break;
    case 'inventory':
      await fetchAPI('/api/v1/inventory');
      break;
    case 'machines':
      logger.info('Fetching machines...');
      // Добавить позже
      break;
    default:
      logger.info('VHM24 CLI - Vending Machine Management');
      logger.info('\nUsage: node vhm24-cli.js <command>');
      logger.info('\nCommands:');
      logger.info('  health     - Check system health');
      logger.info('  stats      - Dashboard statistics');
      logger.info('  tasks      - List all tasks');
      logger.info('  inventory  - List inventory');
      logger.info('  machines   - List machines (TODO)');
  }
}

main();
