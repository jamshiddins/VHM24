/**
 * VHM24 - VendHub Manager 24/7
 * System Monitor
 * Checks all services are running 24/7
 */

const axios = require('axios');

const services = [
  { name: 'Gateway', url: 'http://localhost:8000/health' },
  { name: 'Auth', url: 'http://localhost:3001/health' },
  { name: 'Machines', url: 'http://localhost:3002/health' },
  { name: 'Inventory', url: 'http://localhost:3003/health' },
  { name: 'Tasks', url: 'http://localhost:3004/health' },
  { name: 'Bunkers', url: 'http://localhost:3005/health' }
];

async function checkServices() {
  console.log('🔍 VHM24 - Checking 24/7 service status...\n');
  
  let allHealthy = true;
  
  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      if (response.data.status === 'ok') {
        console.log(`✅ ${service.name} - ONLINE 24/7`);
      } else {
        console.log(`⚠️  ${service.name} - ISSUE DETECTED`);
        allHealthy = false;
      }
    } catch (error) {
      console.log(`❌ ${service.name} - OFFLINE`);
      allHealthy = false;
    }
  }
  
  console.log('\n' + '='.repeat(40));
  if (allHealthy) {
    console.log('✅ VHM24 System Status: FULLY OPERATIONAL 24/7');
  } else {
    console.log('⚠️  VHM24 System Status: ISSUES DETECTED');
    console.log('Some services need attention for 24/7 operation');
  }
}

// Run check immediately
checkServices();

// Check every 5 minutes for 24/7 monitoring
setInterval(checkServices, 5 * 60 * 1000);

console.log('\n⏰ VHM24 Monitor running - checking every 5 minutes');
console.log('Press Ctrl+C to stop monitoring\n');
