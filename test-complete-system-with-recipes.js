const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * VHM24 Complete System Test with Recipes API
 * Комплексное тестирование системы включая новый Recipes API
 */

const axios = require('axios');
const fs = require('fs')
const { promises: fsPromises } = fs;

// Конфигурация
const config = {
  gateway: 'http://localhost:3000',
  services: {
    auth: 'http://localhost:3001',
    machines: 'http://localhost:3002',
    inventory: 'http://localhost:3003',
    tasks: 'http://localhost:3004',
    routes: 'http://localhost:3005',
    warehouse: 'http://localhost:3006',
    recipes: 'http://localhost:3007',
    notifications: 'http://localhost:3008',
    monitoring: 'http://localhost:3009',
    backup: 'http://localhost:3010'
  },
  dashboard: 'http://localhost:3001'
};

// Тестовые данные
const testData = {
  user: {
    telegramId: '123456789',
    username: 'test_user',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@vhm24.uz',
    password: '${process.env.PASSWORD_787}',
    roles: ['MANAGER']
  },
  recipe: {
    name: 'Тестовый кофе',
    description: 'Простой рецепт кофе для автомата',
    category: 'Напитки',
    preparationTime: 2,
    servings: 1,
    instructions: 'Смешать ингредиенты и подать горячим',
    ingredients: [
      { ingredientId: 1, quantity: 15, unit: 'г' },
      { ingredientId: 2, quantity: 200, unit: 'мл' }
    ]
  },
  ingredient: {
    name: 'Кофе молотый',
    category: 'Напитки',
    unit: 'г',
    costPerUnit: 2.5,
    supplier: 'Coffee Supply Co',
    description: 'Высококачественный молотый кофе'
  }
};

let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Утилиты
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  
  logger.info(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function addTestResult(name, passed, message = '') {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    log(`✅ ${name}`, 'success');
  } else {
    testResults.failed++;
    log(`❌ ${name}: ${message}`, 'error');
  }
}

async function makeRequest(url, options = {}) {
  try {
    const response = await axios({
      url,
      timeout: 10000,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      }
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

// Тесты сервисов
async function testServiceHealth(serviceName, url) {
  log(`Тестирование здоровья сервиса: ${serviceName}`);
  
  const result = await makeRequest(`${url}/health`);
  
  if (result.success && result.status === 200) {
    addTestResult(`${serviceName} Health Check`, true);
    return true;
  } else {
    addTestResult(`${serviceName} Health Check`, false, result.error || 'Service unavailable');
    return false;
  }
}

async function testAuthService() {
  log('Тестирование Auth Service...');
  
  // Регистрация пользователя
  const registerResult = await makeRequest(`${config.services.auth}/api/v1/auth/register`, {
    method: 'POST',
    data: testData.user
  });
  
  if (registerResult.success) {
    addTestResult('User Registration', true);
  } else {
    addTestResult('User Registration', false, registerResult.error);
  }
  
  // Вход в систему
  const loginResult = await makeRequest(`${config.services.auth}/api/v1/auth/login`, {
    method: 'POST',
    data: {
      telegramId: testData.user.telegramId,
      password: testData.user.password
    }
  });
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    addTestResult('User Login', true);
    return true;
  } else {
    addTestResult('User Login', false, loginResult.error);
    return false;
  }
}

async function testRecipesService() {
  log('Тестирование Recipes Service...');
  
  // Создание ингредиента
  const ingredientResult = await makeRequest(`${config.services.recipes}/api/v1/ingredients`, {
    method: 'POST',
    data: testData.ingredient
  });
  
  if (ingredientResult.success) {
    addTestResult('Create Ingredient', true);
    
    // Обновляем ID ингредиента в тестовых данных
    testData.recipe.ingredients[0].ingredientId = ingredientResult.data.data.id;
  } else {
    addTestResult('Create Ingredient', false, ingredientResult.error);
  }
  
  // Создание второго ингредиента (вода)
  const waterIngredient = {
    name: 'Вода',
    category: 'Напитки',
    unit: 'мл',
    costPerUnit: 0.01,
    supplier: 'Water Supply',
    description: 'Очищенная вода'
  };
  
  const waterResult = await makeRequest(`${config.services.recipes}/api/v1/ingredients`, {
    method: 'POST',
    data: waterIngredient
  });
  
  if (waterResult.success) {
    testData.recipe.ingredients[1].ingredientId = waterResult.data.data.id;
  }
  
  // Получение списка ингредиентов
  const ingredientsListResult = await makeRequest(`${config.services.recipes}/api/v1/ingredients`);
  
  if (ingredientsListResult.success && Array.isArray(ingredientsListResult.data.data)) {
    addTestResult('Get Ingredients List', true);
  } else {
    addTestResult('Get Ingredients List', false, ingredientsListResult.error);
  }
  
  // Создание рецепта
  const recipeResult = await makeRequest(`${config.services.recipes}/api/v1/recipes`, {
    method: 'POST',
    data: testData.recipe
  });
  
  if (recipeResult.success) {
    addTestResult('Create Recipe', true);
    
    const recipeId = recipeResult.data.data.id;
    
    // Получение рецепта по ID
    const getRecipeResult = await makeRequest(`${config.services.recipes}/api/v1/recipes/${recipeId}`);
    
    if (getRecipeResult.success) {
      addTestResult('Get Recipe by ID', true);
    } else {
      addTestResult('Get Recipe by ID', false, getRecipeResult.error);
    }
    
    // Обновление рецепта
    const updateData = {
      name: 'Обновлённый тестовый кофе',
      description: 'Обновлённое описание рецепта'
    };
    
    const updateResult = await makeRequest(`${config.services.recipes}/api/v1/recipes/${recipeId}`, {
      method: 'PUT',
      data: updateData
    });
    
    if (updateResult.success) {
      addTestResult('Update Recipe', true);
    } else {
      addTestResult('Update Recipe', false, updateResult.error);
    }
    
  } else {
    addTestResult('Create Recipe', false, recipeResult.error);
  }
  
  // Получение списка рецептов
  const recipesListResult = await makeRequest(`${config.services.recipes}/api/v1/recipes`);
  
  if (recipesListResult.success && Array.isArray(recipesListResult.data.data)) {
    addTestResult('Get Recipes List', true);
  } else {
    addTestResult('Get Recipes List', false, recipesListResult.error);
  }
  
  // Поиск рецептов
  const searchResult = await makeRequest(`${config.services.recipes}/api/v1/recipes?search=кофе`);
  
  if (searchResult.success) {
    addTestResult('Search Recipes', true);
  } else {
    addTestResult('Search Recipes', false, searchResult.error);
  }
  
  // Фильтрация по категории
  const filterResult = await makeRequest(`${config.services.recipes}/api/v1/recipes?category=Напитки`);
  
  if (filterResult.success) {
    addTestResult('Filter Recipes by Category', true);
  } else {
    addTestResult('Filter Recipes by Category', false, filterResult.error);
  }
  
  // Расчёт себестоимости
  const costCalculationData = {
    ingredients: testData.recipe.ingredients,
    servings: 1,
    markup: 20
  };
  
  const costResult = await makeRequest(`${config.services.recipes}/api/v1/cost-calculation`, {
    method: 'POST',
    data: costCalculationData
  });
  
  if (costResult.success && costResult.data.data.totalCost !== undefined) {
    addTestResult('Cost Calculation', true);
  } else {
    addTestResult('Cost Calculation', false, costResult.error);
  }
  
  // Получение категорий рецептов
  const categoriesResult = await makeRequest(`${config.services.recipes}/api/v1/recipe-categories`);
  
  if (categoriesResult.success && Array.isArray(categoriesResult.data.data)) {
    addTestResult('Get Recipe Categories', true);
  } else {
    addTestResult('Get Recipe Categories', false, categoriesResult.error);
  }
}

async function testMachinesService() {
  log('Тестирование Machines Service...');
  
  const result = await makeRequest(`${config.services.machines}/api/v1/machines`);
  
  if (result.success) {
    addTestResult('Get Machines List', true);
  } else {
    addTestResult('Get Machines List', false, result.error);
  }
}

async function testInventoryService() {
  log('Тестирование Inventory Service...');
  
  const result = await makeRequest(`${config.services.inventory}/api/v1/inventory`);
  
  if (result.success) {
    addTestResult('Get Inventory List', true);
  } else {
    addTestResult('Get Inventory List', false, result.error);
  }
}

async function testTasksService() {
  log('Тестирование Tasks Service...');
  
  const result = await makeRequest(`${config.services.tasks}/api/v1/tasks`);
  
  if (result.success) {
    addTestResult('Get Tasks List', true);
  } else {
    addTestResult('Get Tasks List', false, result.error);
  }
}

async function testRoutesService() {
  log('Тестирование Routes Service...');
  
  const result = await makeRequest(`${config.services.routes}/api/v1/routes`);
  
  if (result.success) {
    addTestResult('Get Routes List', true);
  } else {
    addTestResult('Get Routes List', false, result.error);
  }
}

async function testWarehouseService() {
  log('Тестирование Warehouse Service...');
  
  const result = await makeRequest(`${config.services.warehouse}/api/v1/warehouse`);
  
  if (result.success) {
    addTestResult('Get Warehouse Data', true);
  } else {
    addTestResult('Get Warehouse Data', false, result.error);
  }
}

async function testNotificationsService() {
  log('Тестирование Notifications Service...');
  
  const result = await makeRequest(`${config.services.notifications}/api/v1/notifications`);
  
  if (result.success) {
    addTestResult('Get Notifications', true);
  } else {
    addTestResult('Get Notifications', false, result.error);
  }
}

async function testMonitoringService() {
  log('Тестирование Monitoring Service...');
  
  const result = await makeRequest(`${config.services.monitoring}/api/v1/monitoring/status`);
  
  if (result.success) {
    addTestResult('Get Monitoring Status', true);
  } else {
    addTestResult('Get Monitoring Status', false, result.error);
  }
}

async function testBackupService() {
  log('Тестирование Backup Service...');
  
  const result = await makeRequest(`${config.services.backup}/api/v1/backup/status`);
  
  if (result.success) {
    addTestResult('Get Backup Status', true);
  } else {
    addTestResult('Get Backup Status', false, result.error);
  }
}

async function testGatewayIntegration() {
  log('Тестирование Gateway Integration...');
  
  // Тест роутинга через gateway
  const services = ['auth', 'machines', 'recipes', 'inventory', 'tasks'];
  
  for (const service of services) {
    const result = await makeRequest(`${config.gateway}/api/v1/${service}/health`);
    
    if (result.success) {
      addTestResult(`Gateway ${service} routing`, true);
    } else {
      addTestResult(`Gateway ${service} routing`, false, result.error);
    }
  }
}

async function testWebDashboard() {
  log('Тестирование Web Dashboard...');
  
  // Тест доступности dashboard
  const result = await makeRequest(config.dashboard);
  
  if (result.success) {
    addTestResult('Web Dashboard Accessibility', true);
  } else {
    addTestResult('Web Dashboard Accessibility', false, result.error);
  }
}

// Основная функция тестирования
async function runCompleteSystemTest() {
  log('🚀 Запуск комплексного тестирования системы VHM24 с Recipes API', 'info');
  log('=' * 80, 'info');
  
  try {
    // Тестирование здоровья всех сервисов
    log('\n📊 Проверка здоровья сервисов...', 'info');
    for (const [name, url] of Object.entries(config.services)) {
      await testServiceHealth(name, url);
    }
    
    // Тестирование аутентификации
    log('\n🔐 Тестирование аутентификации...', 'info');
    const authSuccess = await testAuthService();
    
    if (authSuccess) {
      // Тестирование основных сервисов
      log('\n🔧 Тестирование основных сервисов...', 'info');
      await testMachinesService();
      await testInventoryService();
      await testTasksService();
      await testRoutesService();
      await testWarehouseService();
      
      // Тестирование нового Recipes API
      log('\n🍳 Тестирование Recipes API...', 'info');
      await testRecipesService();
      
      // Тестирование вспомогательных сервисов
      log('\n📡 Тестирование вспомогательных сервисов...', 'info');
      await testNotificationsService();
      await testMonitoringService();
      await testBackupService();
      
      // Тестирование интеграции
      log('\n🌐 Тестирование интеграции...', 'info');
      await testGatewayIntegration();
      await testWebDashboard();
    } else {
      log('❌ Пропуск тестов из-за ошибки аутентификации', 'error');
    }
    
  } catch (error) {
    log(`❌ Критическая ошибка тестирования: ${error.message}`, 'error');
  }
  
  // Генерация отчёта
  generateTestReport();
}

function generateTestReport() {
  log('\n📋 Генерация отчёта тестирования...', 'info');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)
    },
    tests: testResults.tests,
    config: config
  };
  
  // Сохранение отчёта
  const reportFile = `test-report-complete-${Date.now()}.json`;
  await fsPromises.writeFile(reportFile, JSON.stringify(report, null, 2));
  
  // Вывод результатов
  log('\n' + '=' * 80, 'info');
  log('📊 РЕЗУЛЬТАТЫ КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ', 'info');
  log('=' * 80, 'info');
  log(`✅ Пройдено тестов: ${testResults.passed}`, 'success');
  log(`❌ Провалено тестов: ${testResults.failed}`, 'error');
  log(`📈 Процент успеха: ${report.summary.successRate}%`, 'info');
  log(`📄 Отчёт сохранён: ${reportFile}`, 'info');
  
  if (testResults.failed > 0) {
    log('\n❌ Провалившиеся тесты:', 'error');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => log(`  • ${test.name}: ${test.message}`, 'error'));
  }
  
  log('\n🎉 Тестирование завершено!', 'success');
  
  // Возврат кода выхода
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Запуск тестирования
if (require.main === module) {
  runCompleteSystemTest().catch(error => {
    log(`💥 Фатальная ошибка: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runCompleteSystemTest,
  testResults,
  config
};
