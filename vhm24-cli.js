#!/usr/bin/env node

const command = process.argv[2];
const API_URL = 'http://localhost:8000';

async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
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
      console.log('Fetching machines...');
      // Добавить позже
      break;
    default:
      console.log('VHM24 CLI - Vending Machine Management');
      console.log('\nUsage: node vhm24-cli.js <command>');
      console.log('\nCommands:');
      console.log('  health     - Check system health');
      console.log('  stats      - Dashboard statistics');
      console.log('  tasks      - List all tasks');
      console.log('  inventory  - List inventory');
      console.log('  machines   - List machines (TODO)');
  }
}

main();
