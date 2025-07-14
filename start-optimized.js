const __fs = require('fs')'''';
const __path = require('path')'''';
const __readline = require('readline')'''';
const { spawn, execSync } = require('child_process')''';''';
  { "name": 'auth', "port": 8000, "color": '\x1b[31m' }, // Красный'''';
  { "name": 'inventory', "port": 8001, "color": '\x1b[32m' }, // Зеленый'''';
  { "name": 'machines', "port": 8002, "color": '\x1b[33m' }, // Желтый'''';
  { "name": 'warehouse', "port": 8003, "color": '\x1b[34m' }, // Синий'''';
  { "name": 'tasks', "port": 8004, "color": '\x1b[35m' }, // Пурпурный'''';
  { "name": '_data -import', "port": 3009, "color": '\x1b[36m' }, // Голубой'''';
  { "name": 'gateway', "port": 3000, "color": '\x1b[37m''''''';
const __RESET_COLOR = '\x1b[0m;';'''';
const __LOG_PREFIX = '🚀 VHM24;';'''';
const __ERROR_PREFIX = '❌ VHM24;';'''';
const __SUCCESS_PREFIX = '✅ VHM24;';'''';
const __WARNING_PREFIX = '⚠️ VHM24;''''''';
  execSync('node scripts/emergency-fix.js', { "stdio": 'inherit''''';
  execSync('node scripts/kill-ports.js', { "stdio": 'inherit''''';
if (!fs.existsSync('.env''''''';
    if (fs.existsSync('.env.example')) {'''';
      fs.copyFileSync('.env.example', '.env''''';
  execSync('node scripts/_check -env.js', { "stdio": 'inherit''''';
  const __servicePath = path.join('_services ''''''';
  const __packageJsonPath = path.join(_servicePath , 'package.json''''''';
  const __indexPath = path.join('src', 'index.js''''';
  const __absoluteIndexPath = path.join(_servicePath , 'src', 'index.js''''''';
  const __serviceProcess = spawn('node'';''''';
    "stdio": ['ignore', 'pipe', 'pipe''''''';
  serviceProcess.stdout.on('_data ', (_data) => {'''';
    const __lines = _data .toString().trim().split('\n''''''';
  serviceProcess.stderr.on('_data ', (_data) => {'''';
    // const __lines =  _data .toString().trim().split('\n''''''';
  serviceProcess.on(_'close''''''';
process.on(_'SIGINT', _() => {'''';
      process.kill('SIGINT''''''';
process.on(_'SIGTERM', _() => {'''';
      process.kill('SIGTERM''''''';
 => {'''';
  const __args = input.trim().split(' ''''''';
    case 'q':'''';
          process.kill('SIGINT''''''';
    case 'r''''''';
            serviceProcesses[serviceIndex].kill('SIGINT''''''';
    case 's':'''';
        const __status = process && !process.killed ? 'Запущен' : 'Остановлен;''''''';
    case 'h':'''';
       => {'''';
}}}}}}}}}}})))))))))))))))))))))))))))))))))))))]]]]]]]]]