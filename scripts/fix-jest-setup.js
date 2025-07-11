const fs = require('fs');
const path = require('path');

console.log('🔧 Запуск исправления Jest setup...\n');

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

// Шаг 1: Исправление jest.setup.js
console.log('\n📋 Шаг 1: Исправление jest.setup.js');
if (checkFileExists('jest.setup.js')) {
  const jestSetupContent = `// jest.setup.js
// Не импортируем jest, так как он уже доступен глобально
// const { jest } = require('@jest/globals');

// Увеличиваем таймаут для тестов
jest.setTimeout(30000);

// Глобальные моки
global.fetch = jest.fn(() => Promise.resolve({
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
  ok: true,
  status: 200,
  headers: new Map()
}));

// Мок для process.env
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/vhm24_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NODE_ENV = 'test';

// Очистка моков после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});
`;

  fs.writeFileSync('jest.setup.js', jestSetupContent);
  console.log('✅ Исправлен jest.setup.js');
} else {
  console.log('⚠️ Файл не найден: jest.setup.js');
}

// Шаг 2: Исправление тестов
console.log('\n📋 Шаг 2: Исправление тестов');

// Функция для рекурсивного поиска файлов
function findFiles(dir, pattern) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath, pattern));
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }

  return results;
}

// Поиск всех тестовых файлов
const testFiles = findFiles('tests', /\.test\.js$/);
console.log(`Найдено ${testFiles.length} тестовых файлов в директории tests`);

// Исправление тестовых файлов
let fixedFiles = 0;
testFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');

    // Заменяем импорт jest на деструктурированный импорт без jest
    content = content.replace(
      /const\s*\{\s*describe\s*,\s*test\s*,\s*expect\s*,\s*jest\s*(?:,\s*[^}]+)?\s*\}\s*=\s*require\(['"]@jest\/globals['"]\)/g,
      "const { describe, test, expect, beforeEach } = require('@jest/globals')"
    );

    // Заменяем импорт jest на деструктурированный импорт без jest (другой вариант)
    content = content.replace(
      /const\s*\{\s*describe\s*,\s*test\s*,\s*expect\s*,\s*beforeEach\s*,\s*jest\s*(?:,\s*[^}]+)?\s*\}\s*=\s*require\(['"]@jest\/globals['"]\)/g,
      "const { describe, test, expect, beforeEach } = require('@jest/globals')"
    );

    fs.writeFileSync(file, content);
    console.log(`✅ Исправлен файл: ${file}`);
    fixedFiles++;
  } catch (error) {
    console.error(`❌ Ошибка при обработке файла ${file}:`, error.message);
  }
});

console.log(`✅ Исправлено ${fixedFiles} тестовых файлов`);

// Шаг 3: Создание babel.config.js для поддержки ES модулей
console.log('\n📋 Шаг 3: Создание babel.config.js');
const babelConfigContent = `module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }]
  ]
};
`;

fs.writeFileSync('babel.config.js', babelConfigContent);
console.log('✅ Создан babel.config.js');

// Шаг 4: Обновление jest.config.js
console.log('\n📋 Шаг 4: Обновление jest.config.js');
if (checkFileExists('jest.config.js')) {
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
  ],
  // Увеличиваем таймаут для тестов
  testTimeout: 30000,
  // Игнорируем node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(fast-jwt|canvas|skia-canvas)/)'
  ],
  // Мокаем модули, которые вызывают проблемы
  moduleNameMapper: {
    '^canvas$': '<rootDir>/mocks/canvas.js',
    '^skia-canvas$': '<rootDir>/mocks/canvas.js',
    '^fast-jwt$': '<rootDir>/mocks/jwt.js'
  },
  // Используем Babel для трансформации
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
`;

  fs.writeFileSync('jest.config.js', jestConfigContent);
  console.log('✅ Обновлен jest.config.js');
} else {
  console.log('⚠️ Файл не найден: jest.config.js');
}

// Шаг 5: Обновление package.json
console.log('\n📋 Шаг 5: Обновление package.json');
if (checkFileExists('package.json')) {
  let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  let modified = false;

  // Проверка и добавление зависимостей
  packageJson.devDependencies = packageJson.devDependencies || {};

  // Проверка и добавление babel
  if (!packageJson.devDependencies['@babel/core']) {
    packageJson.devDependencies['@babel/core'] = '^7.22.0';
    console.log('✅ Добавлена зависимость: @babel/core');
    modified = true;
  }

  if (!packageJson.devDependencies['@babel/preset-env']) {
    packageJson.devDependencies['@babel/preset-env'] = '^7.22.0';
    console.log('✅ Добавлена зависимость: @babel/preset-env');
    modified = true;
  }

  if (!packageJson.devDependencies['babel-jest']) {
    packageJson.devDependencies['babel-jest'] = '^29.5.0';
    console.log('✅ Добавлена зависимость: babel-jest');
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

console.log('\n✅ Исправление Jest setup завершено!');
console.log('\nДля запуска тестов выполните:');
console.log('npm test');
