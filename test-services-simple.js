const http = require('http');

function checkService(name, port, path = '/health') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${name} (port ${port}): Running - Status ${res.statusCode}`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${name} (port ${port}): ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ ${name} (port ${port}): Timeout`);
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  console.log('=== VHM24 Services Status Check ===\n');
  
  const services = [
    { name: 'Gateway', port: 8000 },
    { name: 'Auth Service', port: 3001 },
    { name: 'Machines Service', port: 3002 },
    { name: 'Inventory Service', port: 3003 },
    { name: 'Tasks Service', port: 3004 },
    { name: 'Bunkers Service', port: 3005 },
    { name: 'Web Dashboard', port: 3000, path: '/' }
  ];
  
  let workingCount = 0;
  
  for (const service of services) {
    const isWorking = await checkService(service.name, service.port, service.path);
    if (isWorking) workingCount++;
  }
  
  console.log(`\n📊 Total: ${workingCount}/${services.length} services running`);
  
  if (workingCount === 0) {
    console.log('\n⚠️  No services are running. Try running: .\\start-all.bat');
  } else if (workingCount < services.length) {
    console.log('\n⚠️  Some services are not running. Check the logs for errors.');
  } else {
    console.log('\n✨ All services are running!');
  }
}

runTests();
