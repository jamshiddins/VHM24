const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Запуск исправления зависимостей VHM24...\n');

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

// Шаг 1: Установка tap для тестов
console.log('\n📋 Шаг 1: Установка tap для тестов');
runCommand('npm install tap --save-dev');

// Шаг 2: Исправление проблемы с fast-jwt
console.log('\n📋 Шаг 2: Исправление проблемы с fast-jwt');
if (checkFileExists('package.json')) {
  let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  // Добавляем overrides для fast-jwt
  if (!packageJson.overrides) {
    packageJson.overrides = {};
  }

  packageJson.overrides['fast-jwt'] = {
    engines: {
      node: '>=16'
    }
  };

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Добавлен override для fast-jwt в package.json');
}

// Шаг 3: Исправление проблемы с canvas
console.log('\n📋 Шаг 3: Исправление проблемы с canvas');
if (checkFileExists('package.json')) {
  let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  // Проверяем, есть ли canvas в зависимостях
  const hasCanvas = packageJson.dependencies && packageJson.dependencies.canvas;

  if (hasCanvas) {
    console.log('Найден пакет canvas в зависимостях, заменяем на skia-canvas');

    // Удаляем canvas и устанавливаем skia-canvas
    delete packageJson.dependencies.canvas;

    if (!packageJson.dependencies['skia-canvas']) {
      packageJson.dependencies['skia-canvas'] = '^0.9.30';
    }

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Заменен canvas на skia-canvas в package.json');
  } else {
    console.log('Пакет canvas не найден в зависимостях');
  }
}

// Шаг 4: Обновление зависимостей
console.log('\n📋 Шаг 4: Обновление зависимостей');
runCommand('npm install');

// Шаг 5: Исправление тестов
console.log('\n📋 Шаг 5: Исправление тестов');

// Функция для обновления тестов
function updateTests(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`⚠️ Директория ${directory} не найдена`);
    return;
  }

  const testFiles = fs
    .readdirSync(directory)
    .filter(file => file.endsWith('.test.js'))
    .map(file => path.join(directory, file));

  testFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Заменяем tap на jest
    if (content.includes("const { test } = require('tap')")) {
      content = content.replace(
        "const { test } = require('tap')",
        "const { describe, it, expect } = require('@jest/globals')"
      );

      // Заменяем tap тесты на jest тесты
      content = content.replace(
        /test\(['"](.+)['"]\s*,\s*async\s*\(\s*t\s*\)\s*=>\s*\{/g,
        "describe('$1', () => {\n  it('should work', async () => {"
      );

      // Заменяем t.equal на expect().toBe()
      content = content.replace(
        /t\.equal\(([^,]+),\s*([^)]+)\)/g,
        'expect($1).toBe($2)'
      );

      // Заменяем t.ok на expect().toBeTruthy()
      content = content.replace(/t\.ok\(([^)]+)\)/g, 'expect($1).toBeTruthy()');

      // Заменяем t.notOk на expect().toBeFalsy()
      content = content.replace(
        /t\.notOk\(([^)]+)\)/g,
        'expect($1).toBeFalsy()'
      );

      // Заменяем t.same на expect().toEqual()
      content = content.replace(
        /t\.same\(([^,]+),\s*([^)]+)\)/g,
        'expect($1).toEqual($2)'
      );

      // Добавляем закрывающую скобку для describe
      content = content.replace(/}\s*\)\s*$/, '  });\n});');

      fs.writeFileSync(file, content);
      console.log(`✅ Обновлен тест: ${file}`);
    }
  });
}

// Обновляем тесты во всех сервисах
const servicesDir = path.join(__dirname, '..', 'services');
if (fs.existsSync(servicesDir)) {
  const services = fs
    .readdirSync(servicesDir)
    .filter(dir => fs.statSync(path.join(servicesDir, dir)).isDirectory());

  services.forEach(service => {
    const testsDir = path.join(servicesDir, service, 'tests');
    if (fs.existsSync(testsDir)) {
      updateTests(testsDir);
    }
  });
}

// Обновляем тесты в корневой директории tests
const testsDir = path.join(__dirname, '..', 'tests');
if (fs.existsSync(testsDir)) {
  const testDirs = fs
    .readdirSync(testsDir)
    .filter(dir => fs.statSync(path.join(testsDir, dir)).isDirectory());

  testDirs.forEach(dir => {
    updateTests(path.join(testsDir, dir));
  });
}

// Шаг 6: Обновление jest.config.js
console.log('\n📋 Шаг 6: Обновление jest.config.js');
if (checkFileExists('jest.config.js')) {
  let jestConfig = fs.readFileSync('jest.config.js', 'utf8');

  // Проверяем, есть ли setupFilesAfterEnv
  if (!jestConfig.includes('setupFilesAfterEnv')) {
    jestConfig = jestConfig.replace(
      'module.exports = {',
      `module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],`
    );

    fs.writeFileSync('jest.config.js', jestConfig);
    console.log('✅ Добавлен setupFilesAfterEnv в jest.config.js');
  }
}

// Шаг 7: Создание jest.setup.js, если его нет
console.log('\n📋 Шаг 7: Создание jest.setup.js');
if (!checkFileExists('jest.setup.js')) {
  const setupContent = `// jest.setup.js
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

  fs.writeFileSync('jest.setup.js', setupContent);
  console.log('✅ Создан jest.setup.js');
}

// Шаг 8: Обновление package.json для запуска тестов
console.log('\n📋 Шаг 8: Обновление package.json для запуска тестов');
if (checkFileExists('package.json')) {
  let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  // Обновляем скрипты для запуска тестов
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  packageJson.scripts.test = 'jest';
  packageJson.scripts['test:watch'] = 'jest --watch';
  packageJson.scripts['test:coverage'] = 'jest --coverage';

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Обновлены скрипты для запуска тестов в package.json');
}

console.log('\n✅ Исправление зависимостей завершено!');
console.log('\nДля запуска тестов выполните:');
console.log('npm test');
