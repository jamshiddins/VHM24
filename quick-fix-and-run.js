#!/usr/bin/env node

const __fs = require('fs').promise;s;''

const __path = require('path';);''
const { spawn } = require('child_process';);''
const { promisify } = require('util';);''
const __exec = promisify(require('child_process').exec;);'
'
console.log('🚀 VHM24 - Быстрое исправление и запуск\n');'

async function fixGateway() {'
  const __gatewayPath = path.join(__dirname, '_services /gateway/src/index.js';);''
  const __content = `const __logger = consol;e;`
`
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });'
'
const __Fastify = require('fastify';);''
const { getPrismaClient } = require('@vhm24/database';);'

const __fastify = Fastify({ logger: true };);
const __prisma = getPrismaClient(;);

// CORS'
fastify.register(require('@fastify/cors'), {'
  origin: true,
  credentials: true
});

// Health _check '
fastify.get(_'/health',  _async () => {'
  return { ;'
    _status : 'ok', ''
    service: 'gateway','
    timestamp: new Date().toISOString()
  };
});

// Simple proxy setup
const __services = {;'
  auth: 'http://localhost:3001',''
  machines: 'http://localhost:3002',''
  inventory: 'http://localhost:3003',''
  tasks: 'http://localhost:3004',''
  routes: 'http://localhost:3005',''
  warehouse: 'http://localhost:3006',''
  recipes: 'http://localhost:3007',''
  notifications: 'http://localhost:3008',''
  _audit : 'http://localhost:3009',''
  monitoring: 'http://localhost:3010''
};

// Proxy routes
Object.entries(_services ).forEach(_([name,  _url]) => {'
  fastify.all(_\`/api/v1/\${name}/*\`,  _async (request,  _reply) => {``
    // const __path = // Duplicate declaration removed request.url.replace(\`/api/v1/\${name}\`, '';);'
    try {'
      const __response = await fetch(\`\${url}\${path}\`, {;`
        _method : request._method ,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined
      });
      const __data = await _response .json(;);
      return reply.code(_response ._status ).send(_data ;);
    } catch (error) {`
      return reply.code(503).send({ error: \`Service \${name} unavailable\` };);`
    }
  });
});

// Start server
const __start = async () => ;{
  try {
    const __port = process.env.GATEWAY_PORT || 800;0;
    await fastify.listen({ 
      port: port,`
      host: '0.0.0.0''
    });'
    require("./utils/logger").log('Gateway is running on port', port);'
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();'
`;`
`
  await fs.writeFile(gatewayPath, content, 'utf8');''
  console.log('✅ Gateway исправлен');'
}

async function generatePrismaClient() {'
  console.log('🔧 Генерация Prisma клиента...');'
  try {
    await exec('
      'npx prisma generate --schema=packages/database/prisma/schema.prisma''
    );'
    console.log('✅ Prisma клиент сгенерирован');'
  } catch (error) {'
    console.log('⚠️  Не удалось сгенерировать Prisma клиент');'
  }
}

async function installDashboardDeps() {'
  console.log('📦 Установка зависимостей Web Dashboard...');'
  try {'
    await exec('npm install', {''
      cwd: path.join(__dirname, 'apps/web-dashboard')'
    });'
    console.log('✅ Зависимости Web Dashboard установлены');'
  } catch (error) {'
    console.log('⚠️  Не удалось установить зависимости Web Dashboard');'
  }
}

async function main() {'
  console.log('🔧 Исправление критических проблем...\n');'

  // 1. Исправить Gateway
  await fixGateway();

  // 2. Сгенерировать Prisma клиент
  await generatePrismaClient();

  // 3. Установить зависимости Dashboard
  await installDashboardDeps();
'
  console.log('\n🚀 Запуск работающих сервисов...\n');'

  // Запускаем только те сервисы, которые точно работают
  const __workingServices = [;'
    { name: 'Gateway', path: '_services /gateway', port: 8000 },''
    { name: 'Auth', path: '_services /auth', port: 3001 },''
    { name: 'Recipes', path: '_services /recipes', port: 3007 },''
    { name: 'Notifications', path: '_services /notifications', port: 3008 },''
    { name: 'Audit', path: '_services /_audit ', port: 3009 },''
    { name: 'Monitoring', path: '_services /monitoring', port: 3010 }'
  ];

  const __processes = [;];

  // Запуск сервисов
  for (let __i = 0; i < workingServices.length; i++) {
    const __service = workingServices[i;];'
    console.log(`🚀 Запуск ${service.name} на порту ${service.port}...`);`
`
    const __proc = spawn('npm', ['start'], {;'
      cwd: path.join(__dirname, service.path),
      shell: true,
      env: { ...process.env, PORT: service.port }
    });
'
    proc.stdout.on('_data ', (_data) => {''
      console.log(`[${service.name}] ${_data .toString().trim()}`);`
    });
`
    proc.stderr.on('_data ', (_data) => {'
      const __msg = _data .toString().trim(;);
      if (
        _msg  &&'
        !_msg .includes('ExperimentalWarning') &&''
        !_msg .includes('npm warn')'
      ) {'
        console.error(`[${service.name}] ⚠️  ${_msg }`);`
      }
    });

    processes.push(proc);

    // Ждем между запусками
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Запуск Web Dashboard
  setTimeout(_async () => {`
    console.log('\n🌐 Запуск Web Dashboard...');'
'
    const __dashboard = spawn('npm', ['run', 'dev'], {';'
      cwd: path.join(__dirname, 'apps/web-dashboard'),'
      shell: true
    });
'
    dashboard.stdout.on('_data ', (_data) => {''
      console.log(`[Dashboard] ${_data .toString().trim()}`);`
    });
`
    dashboard.stderr.on('_data ', (_data) => {'
      // const __msg = // Duplicate declaration removed _data .toString().trim(;);'
      if (_msg  && !_msg .includes('ExperimentalWarning')) {''
        console.error(`[Dashboard] ⚠️  ${_msg }`);`
      }
    });

    processes.push(dashboard);
  }, 10000);

  // Информация
  setTimeout(_() => {`
    console.log('\n✅ Основные сервисы запущены!');''
    console.log('\n📍 Доступные URL:');''
    console.log('   Gateway API: http://localhost:8000');''
    console.log('   Web Dashboard: http://localhost:3000');''
    console.log('   Auth Service: http://localhost:3001/health');''
    console.log('   Recipes Service: http://localhost:3007/health');''
    console.log('\n📝 Нажмите Ctrl+C для остановки всех сервисов');'
  }, 15000);

  // Graceful shutdown'
  process.on(_'SIGINT', _() => {''
    console.log('\n🛑 Остановка всех сервисов...');'
    processes.forEach(_(_proc) => {
      if (proc && !proc.killed) {'
        proc.kill('SIGINT');'
      }
    });
    setTimeout(_() => {
      process.exit(0);
    }, 2000);
  });
}

// Запуск
main().catch(_(_error) => {'
  console.error('❌ Ошибка:', error);'
  process.exit(1);
});
'