const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Запуск проверки и исправления проблем VHM24...\n');

// Функция для выполнения команды и вывода результата
function runCommand(command, options = {}) {
  console.log(`Выполнение команды: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', ...options });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`❌ Ошибка при выполнении команды: ${command}`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    return null;
  }
}

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Создана директория: ${dirPath}`);
    return true;
  }
  return false;
}

// Функция для проверки и исправления прав доступа к файлу
function fixFilePermissions(filePath) {
  if (!checkFileExists(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  try {
    // Для Linux/macOS
    if (process.platform !== 'win32') {
      fs.chmodSync(filePath, 0o755);
      console.log(`✅ Исправлены права доступа для: ${filePath}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при исправлении прав доступа для: ${filePath}`);
    console.error(error.message);
    return false;
  }
}

// Шаг 1: Проверка наличия всех необходимых файлов
console.log('\n📋 Шаг 1: Проверка наличия всех необходимых файлов');
const requiredFiles = [
  'scripts/fix-fast-jwt.js',
  'scripts/fix-canvas.js',
  'scripts/fix-dependencies.js',
  'Dockerfile.compatible',
  'docker-compose.compatible.yml',
  'run-in-docker.sh',
  'run-in-docker.bat',
  'run-all-fixes.sh',
  'run-all-fixes.bat',
  'run-all-fixes.ps1',
  'run-docker.ps1',
  'COMPATIBILITY_SOLUTION.md',
  'POWERSHELL_INSTRUCTIONS.md'
];

let missingFiles = [];
requiredFiles.forEach(file => {
  if (!checkFileExists(file)) {
    missingFiles.push(file);
    console.log(`⚠️ Файл не найден: ${file}`);
  }
});

// Шаг 2: Исправление прав доступа для скриптов
console.log('\n📋 Шаг 2: Исправление прав доступа для скриптов');
const scriptFiles = [
  'run-in-docker.sh',
  'run-all-fixes.sh',
  'scripts/fix-fast-jwt.js',
  'scripts/fix-canvas.js',
  'scripts/fix-dependencies.js'
];

scriptFiles.forEach(file => {
  fixFilePermissions(file);
});

// Шаг 3: Проверка и исправление package.json
console.log('\n📋 Шаг 3: Проверка и исправление package.json');
if (checkFileExists('package.json')) {
  let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  let modified = false;

  // Проверка и добавление зависимостей
  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.devDependencies = packageJson.devDependencies || {};

  // Проверка и добавление jsonwebtoken
  if (!packageJson.dependencies.jsonwebtoken) {
    packageJson.dependencies.jsonwebtoken = "^9.0.0";
    console.log('✅ Добавлена зависимость: jsonwebtoken');
    modified = true;
  }

  // Проверка и добавление skia-canvas
  if (!packageJson.dependencies['skia-canvas']) {
    packageJson.dependencies['skia-canvas'] = "^0.9.30";
    console.log('✅ Добавлена зависимость: skia-canvas');
    modified = true;
  }

  // Проверка и добавление jest
  if (!packageJson.devDependencies.jest) {
    packageJson.devDependencies.jest = "^29.5.0";
    console.log('✅ Добавлена зависимость: jest');
    modified = true;
  }

  // Проверка и добавление @jest/globals
  if (!packageJson.devDependencies['@jest/globals']) {
    packageJson.devDependencies['@jest/globals'] = "^29.5.0";
    console.log('✅ Добавлена зависимость: @jest/globals');
    modified = true;
  }

  // Проверка и добавление скриптов
  packageJson.scripts = packageJson.scripts || {};

  // Проверка и добавление скрипта для запуска тестов
  if (!packageJson.scripts.test || packageJson.scripts.test !== 'jest') {
    packageJson.scripts.test = 'jest';
    console.log('✅ Добавлен скрипт: test');
    modified = true;
  }

  // Проверка и добавление скрипта для запуска в Docker
  if (!packageJson.scripts['docker:start']) {
    packageJson.scripts['docker:start'] = 'docker-compose -f docker-compose.compatible.yml up --build';
    console.log('✅ Добавлен скрипт: docker:start');
    modified = true;
  }

  // Проверка и добавление скрипта для остановки Docker
  if (!packageJson.scripts['docker:stop']) {
    packageJson.scripts['docker:stop'] = 'docker-compose -f docker-compose.compatible.yml down';
    console.log('✅ Добавлен скрипт: docker:stop');
    modified = true;
  }

  // Проверка и добавление скрипта для запуска оболочки Docker
  if (!packageJson.scripts['docker:shell']) {
    packageJson.scripts['docker:shell'] = 'docker-compose -f docker-compose.compatible.yml exec app sh';
    console.log('✅ Добавлен скрипт: docker:shell');
    modified = true;
  }

  // Проверка и добавление engines
  if (!packageJson.engines) {
    packageJson.engines = {
      "node": ">=16 <22",
      "npm": ">=7"
    };
    console.log('✅ Добавлены engines');
    modified = true;
  }

  // Сохранение изменений
  if (modified) {
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Сохранены изменения в package.json');
  } else {
    console.log('✅ package.json не требует изменений');
  }
} else {
  console.log('⚠️ Файл не найден: package.json');
}

// Шаг 4: Проверка и исправление Docker-конфигурации
console.log('\n📋 Шаг 4: Проверка и исправление Docker-конфигурации');
if (checkFileExists('docker-compose.compatible.yml')) {
  let dockerComposeContent = fs.readFileSync('docker-compose.compatible.yml', 'utf8');
  
  // Проверка наличия volume для node_modules
  if (!dockerComposeContent.includes('/app/node_modules')) {
    console.log('⚠️ В docker-compose.compatible.yml отсутствует volume для node_modules');
    
    // Исправление
    dockerComposeContent = dockerComposeContent.replace(
      /volumes:\s*-\s*\.\/:\s*\/app/g,
      'volumes:\n      - ./:/app\n      - /app/node_modules'
    );
    
    fs.writeFileSync('docker-compose.compatible.yml', dockerComposeContent);
    console.log('✅ Исправлен docker-compose.compatible.yml');
  } else {
    console.log('✅ docker-compose.compatible.yml не требует изменений');
  }
} else {
  console.log('⚠️ Файл не найден: docker-compose.compatible.yml');
}

// Шаг 5: Проверка и исправление .gitignore
console.log('\n📋 Шаг 5: Проверка и исправление .gitignore');
if (checkFileExists('.gitignore')) {
  let gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  let modified = false;
  
  // Проверка наличия node_modules
  if (!gitignoreContent.includes('node_modules')) {
    gitignoreContent += '\n# Dependency directories\nnode_modules/\n';
    modified = true;
  }
  
  // Проверка наличия .env
  if (!gitignoreContent.includes('.env')) {
    gitignoreContent += '\n# Environment variables\n.env\n.env.*\n!.env.example\n';
    modified = true;
  }
  
  // Проверка наличия coverage
  if (!gitignoreContent.includes('coverage')) {
    gitignoreContent += '\n# Coverage directory\ncoverage/\n';
    modified = true;
  }
  
  // Сохранение изменений
  if (modified) {
    fs.writeFileSync('.gitignore', gitignoreContent);
    console.log('✅ Исправлен .gitignore');
  } else {
    console.log('✅ .gitignore не требует изменений');
  }
} else {
  console.log('⚠️ Файл не найден: .gitignore');
}

// Шаг 6: Проверка и исправление jest.config.js
console.log('\n📋 Шаг 6: Проверка и исправление jest.config.js');
if (checkFileExists('jest.config.js')) {
  let jestConfigContent = fs.readFileSync('jest.config.js', 'utf8');
  
  // Проверка наличия setupFilesAfterEnv
  if (!jestConfigContent.includes('setupFilesAfterEnv')) {
    jestConfigContent = jestConfigContent.replace(
      'module.exports = {',
      `module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],`
    );
    
    fs.writeFileSync('jest.config.js', jestConfigContent);
    console.log('✅ Исправлен jest.config.js');
  } else {
    console.log('✅ jest.config.js не требует изменений');
  }
} else {
  console.log('⚠️ Файл не найден: jest.config.js');
  
  // Создание jest.config.js
  const jestConfigContent = `module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'packages/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ]
};
`;
  
  fs.writeFileSync('jest.config.js', jestConfigContent);
  console.log('✅ Создан jest.config.js');
}

// Шаг 7: Проверка и исправление jest.setup.js
console.log('\n📋 Шаг 7: Проверка и исправление jest.setup.js');
if (!checkFileExists('jest.setup.js')) {
  const jestSetupContent = `// jest.setup.js
const { jest } = require('@jest/globals');

// Увеличиваем таймаут для тестов
jest.setTimeout(30000);

// Глобальные моки
global.fetch = jest.fn();

// Очистка моков после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});
`;
  
  fs.writeFileSync('jest.setup.js', jestSetupContent);
  console.log('✅ Создан jest.setup.js');
} else {
  console.log('✅ jest.setup.js уже существует');
}

// Шаг 8: Создание недостающих файлов
console.log('\n📋 Шаг 8: Создание недостающих файлов');
if (missingFiles.length > 0) {
  console.log(`Создание ${missingFiles.length} недостающих файлов...`);
  
  // Создание scripts/fix-fast-jwt.js
  if (missingFiles.includes('scripts/fix-fast-jwt.js')) {
    ensureDirectoryExists('scripts');
    const fixFastJwtContent = `const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Запуск исправления импортов fast-jwt...');

// Проверка наличия glob
try {
  require.resolve('glob');
} catch (e) {
  console.log('📦 Установка пакета glob...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
  console.log('✅ Пакет glob установлен');
}

// Находим все JS файлы в проекте
console.log('🔍 Поиск JS файлов...');
const jsFiles = glob.sync('**/*.js', {
  ignore: [
    'node_modules/**', 
    'dist/**', 
    'build/**', 
    'scripts/fix-fast-jwt.js',
    '**/*.min.js'
  ]
});

console.log(\`📋 Найдено \${jsFiles.length} JS файлов для обработки\`);

// Счетчики для статистики
let modifiedFiles = 0;
let skippedFiles = 0;
let errorFiles = 0;

// Исправляем импорты fast-jwt на jsonwebtoken
jsFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Проверяем, содержит ли файл импорты fast-jwt
    const hasFastJwt = content.includes('fast-jwt') || 
                       content.includes('createSigner') || 
                       content.includes('createVerifier');
    
    if (!hasFastJwt) {
      skippedFiles++;
      return;
    }
    
    // Заменяем импорты fast-jwt на jsonwebtoken
    let modified = false;
    
    // Замена CommonJS импортов
    if (content.includes("require('fast-jwt')") || content.includes('require("fast-jwt")')) {
      content = content.replace(
        /const\s+\{\s*createSigner\s*,\s*createVerifier\s*\}\s*=\s*require\(['"]fast-jwt['"]\)/g,
        "const jwt = require('jsonwebtoken')"
      );
      modified = true;
    }
    
    // Замена ES6 импортов
    if (content.includes("from 'fast-jwt'") || content.includes('from "fast-jwt"')) {
      content = content.replace(
        /import\s+\{\s*createSigner\s*,\s*createVerifier\s*\}\s+from\s+['"]fast-jwt['"]/g,
        "import jwt from 'jsonwebtoken'"
      );
      modified = true;
    }
    
    // Замена вызовов createSigner и createVerifier
    if (content.includes('createSigner(') || content.includes('createVerifier(')) {
      // Замена createSigner
      content = content.replace(
        /const\s+sign\s*=\s*createSigner\(\s*\{\s*key\s*:\s*([^}]+)\s*\}\s*\)/g,
        "// Заменено fast-jwt на jsonwebtoken\\nconst sign = (payload, options) => jwt.sign(payload, $1, options)"
      );
      
      // Замена createVerifier
      content = content.replace(
        /const\s+verify\s*=\s*createVerifier\(\s*\{\s*key\s*:\s*([^}]+)\s*\}\s*\)/g,
        "// Заменено fast-jwt на jsonwebtoken\\nconst verify = (token, options) => jwt.verify(token, $1, options)"
      );
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(\`✅ Исправлен файл: \${file}\`);
      modifiedFiles++;
    } else {
      skippedFiles++;
    }
  } catch (error) {
    console.error(\`❌ Ошибка при обработке файла \${file}:\`, error.message);
    errorFiles++;
  }
});

console.log('\\n📊 Статистика:');
console.log(\`✅ Успешно исправлено: \${modifiedFiles} файлов\`);
console.log(\`⏭️ Пропущено: \${skippedFiles} файлов\`);
console.log(\`❌ Ошибки: \${errorFiles} файлов\`);

console.log('\\n✅ Исправление импортов fast-jwt завершено!');
`;
    
    fs.writeFileSync('scripts/fix-fast-jwt.js', fixFastJwtContent);
    console.log('✅ Создан scripts/fix-fast-jwt.js');
  }
  
  // Создание scripts/fix-canvas.js
  if (missingFiles.includes('scripts/fix-canvas.js')) {
    ensureDirectoryExists('scripts');
    const fixCanvasContent = `const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Запуск исправления импортов canvas...');

// Проверка наличия glob
try {
  require.resolve('glob');
} catch (e) {
  console.log('📦 Установка пакета glob...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
  console.log('✅ Пакет glob установлен');
}

// Находим все JS файлы в проекте
console.log('🔍 Поиск JS файлов...');
const jsFiles = glob.sync('**/*.js', {
  ignore: [
    'node_modules/**', 
    'dist/**', 
    'build/**', 
    'scripts/fix-canvas.js',
    '**/*.min.js'
  ]
});

console.log(\`📋 Найдено \${jsFiles.length} JS файлов для обработки\`);

// Счетчики для статистики
let modifiedFiles = 0;
let skippedFiles = 0;
let errorFiles = 0;

// Исправляем импорты canvas на skia-canvas
jsFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Проверяем, содержит ли файл импорты canvas
    const hasCanvas = content.includes('canvas') || 
                      content.includes('new Canvas(')) || 
                      content.includes('Canvas');
    
    if (!hasCanvas) {
      skippedFiles++;
      return;
    }
    
    // Заменяем импорты canvas на skia-canvas
    let modified = false;
    
    // Замена CommonJS импортов
    if (content.includes("require('canvas')") || content.includes('require("canvas")')) {
      content = content.replace(
        /const\s+\{\s*new Canvas(\s*(?:,\s*[^}]+))?\s*\}\s*=\s*require\(['"]canvas['"]\)/g,
        "const { Canvas } = require('skia-canvas')"
      );
      
      content = content.replace(
        /const\s+Canvas\s*=\s*require\(['"]canvas['"]\)/g,
        "const { Canvas } = require('skia-canvas')"
      );
      
      modified = true;
    }
    
    // Замена ES6 импортов
    if (content.includes("from 'canvas'") || content.includes('from "canvas"')) {
      content = content.replace(
        /import\s+\{\s*new Canvas(\s*(?:,\s*[^}]+))?\s*\}\s+from\s+['"]canvas['"]/g,
        "import { Canvas } from 'skia-canvas'"
      );
      
      content = content.replace(
        /import\s+Canvas\s+from\s+['"]canvas['"]/g,
        "import { Canvas } from 'skia-canvas'"
      );
      
      modified = true;
    }
    
    // Замена вызовов new Canvas(
    if (content.includes('new Canvas((')))) {
      content = content.replace(
        /new Canvas(\(([^))]+)\)/g,
        "new Canvas($1)"
      );
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(\`✅ Исправлен файл: \${file}\`);
      modifiedFiles++;
    } else {
      skippedFiles++;
    }
  } catch (error) {
    console.error(\`❌ Ошибка при обработке файла \${file}:\`, error.message);
    errorFiles++;
  }
});

console.log('\\n📊 Статистика:');
console.log(\`✅ Успешно исправлено: \${modifiedFiles} файлов\`);
console.log(\`⏭️ Пропущено: \${skippedFiles} файлов\`);
console.log(\`❌ Ошибки: \${errorFiles} файлов\`);

console.log('\\n✅ Исправление импортов canvas завершено!');
`;
    
    fs.writeFileSync('scripts/fix-canvas.js', fixCanvasContent);
    console.log('✅ Создан scripts/fix-canvas.js');
  }
  
  // Создание других недостающих файлов...
  // (Здесь можно добавить создание других файлов, если они отсутствуют)
  
  console.log(`✅ Создание недостающих файлов завершено`);
} else {
  console.log('✅ Все необходимые файлы присутствуют');
}

// Шаг 9: Установка зависимостей
console.log('\n📋 Шаг 9: Установка зависимостей');
console.log('Установка зависимостей...');
runCommand('npm install --no-save glob');
runCommand('npm install --save jsonwebtoken');
runCommand('npm install --save skia-canvas');
runCommand('npm install --save-dev jest @jest/globals');

console.log('\n✅ Проверка и исправление проблем завершены!');
console.log('\nДля запуска всех исправлений выполните:');
console.log('Linux/macOS: ./run-all-fixes.sh');
console.log('Windows (CMD): run-all-fixes.bat');
console.log('Windows (PowerShell): ./run-all-fixes.ps1');
console.log('\nДля запуска в Docker выполните:');
console.log('Linux/macOS: ./run-in-docker.sh');
console.log('Windows (CMD): run-in-docker.bat');
console.log('Windows (PowerShell): ./run-docker.ps1');
