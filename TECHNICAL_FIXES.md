# ТЕХНИЧЕСКИЕ ИСПРАВЛЕНИЯ В СИСТЕМЕ VHM24

## ОБЩАЯ ИНФОРМАЦИЯ

**Дата:** 16.07.2025
**Проект:** VHM24 (Vending Hub Manager)
**Версия:** 1.0.0
**Статус:** Завершено

## 1. ИСПРАВЛЕНИЕ СИНТАКСИЧЕСКИХ ОШИБОК

### 1.1. Исправления в файле `telegram-bot/src/bot.js`

#### Неопределенные переменные:
```javascript
// До исправления
const bot = new TelegramBot(token, { polling: true });
bot.on('message', handleMessage);

// После исправления
const token = process.env.BOT_TOKEN || config.get('bot.token');
const bot = new TelegramBot(token, { polling: true });
bot.on('message', handleMessage);
```

#### Неправильные импорты:
```javascript
// До исправления
const TelegramBot = require('telegram-bot-api');
const { handleMessage } = require('./handlers');

// После исправления
const TelegramBot = require('node-telegram-bot-api');
const { handleMessage } = require('./handlers/common');
```

#### Добавление обработки ошибок:
```javascript
// До исправления
bot.on('message', handleMessage);

// После исправления
bot.on('message', async (msg) => {
  try {
    await handleMessage(msg);
  } catch (error) {
    logger.error(`Error handling message: ${error.message}`, { error, msg });
    bot.sendMessage(msg.chat.id, 'Произошла ошибка при обработке сообщения. Пожалуйста, попробуйте еще раз.');
  }
});
```

### 1.2. Исправления в файле `telegram-bot/src/fsm/states.js`

#### Неправильные вызовы функций:
```javascript
// До исправления
const nextState = getNextState(currentState, action);
transition(ctx, nextState);

// После исправления
const nextState = getNextState(ctx.session.state, action);
await transition(ctx, nextState);
```

#### Добавление обработки ошибок:
```javascript
// До исправления
function transition(ctx, nextState) {
  ctx.session.state = nextState;
  const handler = stateHandlers[nextState];
  handler(ctx);
}

// После исправления
async function transition(ctx, nextState) {
  try {
    ctx.session.state = nextState;
    const handler = stateHandlers[nextState];
    if (!handler) {
      throw new Error(`Handler not found for state: ${nextState}`);
    }
    await handler(ctx);
  } catch (error) {
    logger.error(`Error during state transition: ${error.message}`, { error, ctx, nextState });
    ctx.session.state = 'ERROR';
    await errorHandler(ctx, error);
  }
}
```

### 1.3. Исправления в файлах `telegram-bot/src/handlers/*.js`

#### Неправильные импорты:
```javascript
// До исправления (handlers/operator/index.js)
const { sendMessage } = require('../../bot');
const { getTaskById } = require('../../services/tasks');

// После исправления
const { sendMessage } = require('../../utils/bot-helpers');
const { getTaskById } = require('../../services/api').tasks;
```

#### Неправильные вызовы функций:
```javascript
// До исправления (handlers/warehouse/index.js)
function handleInventory(ctx) {
  const bags = getBags();
  sendInventoryMessage(ctx, bags);
}

// После исправления
async function handleInventory(ctx) {
  try {
    const bags = await getBags(ctx.session.user.id);
    await sendInventoryMessage(ctx, bags);
  } catch (error) {
    logger.error(`Error handling inventory: ${error.message}`, { error, ctx });
    await ctx.reply('Произошла ошибка при получении данных инвентаризации. Пожалуйста, попробуйте еще раз.');
  }
}
```

## 2. РЕАЛИЗАЦИЯ НЕДОСТАЮЩИХ СОСТОЯНИЙ FSM

### 2.1. Добавление состояний для роли WAREHOUSE

#### Добавление состояния инвентаризации:
```javascript
// Добавлено в telegram-bot/src/fsm/states.js
const stateHandlers = {
  // Существующие состояния...
  
  // Новые состояния для WAREHOUSE
  'WAREHOUSE_INVENTORY': warehouseHandlers.handleInventory,
  'WAREHOUSE_INVENTORY_DETAIL': warehouseHandlers.handleInventoryDetail,
  'WAREHOUSE_INVENTORY_EDIT': warehouseHandlers.handleInventoryEdit,
  'WAREHOUSE_INVENTORY_CONFIRM': warehouseHandlers.handleInventoryConfirm,
  
  // Другие состояния...
};

// Добавлены переходы
const transitions = {
  // Существующие переходы...
  
  // Новые переходы для WAREHOUSE
  'WAREHOUSE_MAIN': {
    'inventory': 'WAREHOUSE_INVENTORY',
    // Другие действия...
  },
  'WAREHOUSE_INVENTORY': {
    'detail': 'WAREHOUSE_INVENTORY_DETAIL',
    'back': 'WAREHOUSE_MAIN',
  },
  'WAREHOUSE_INVENTORY_DETAIL': {
    'edit': 'WAREHOUSE_INVENTORY_EDIT',
    'back': 'WAREHOUSE_INVENTORY',
  },
  'WAREHOUSE_INVENTORY_EDIT': {
    'confirm': 'WAREHOUSE_INVENTORY_CONFIRM',
    'back': 'WAREHOUSE_INVENTORY_DETAIL',
  },
  'WAREHOUSE_INVENTORY_CONFIRM': {
    'done': 'WAREHOUSE_INVENTORY',
    'back': 'WAREHOUSE_INVENTORY_EDIT',
  },
  
  // Другие переходы...
};
```

#### Реализация обработчиков для инвентаризации:
```javascript
// Добавлено в telegram-bot/src/handlers/warehouse/index.js
async function handleInventory(ctx) {
  try {
    const bags = await bagsService.getBags(ctx.session.user.id);
    const message = formatBagsList(bags);
    const keyboard = createInventoryKeyboard(bags);
    await ctx.reply(message, { reply_markup: keyboard });
  } catch (error) {
    logger.error(`Error handling inventory: ${error.message}`, { error, ctx });
    await ctx.reply('Произошла ошибка при получении данных инвентаризации. Пожалуйста, попробуйте еще раз.');
  }
}

async function handleInventoryDetail(ctx) {
  try {
    const bagId = ctx.session.selectedBagId;
    const bag = await bagsService.getBagById(bagId);
    const message = formatBagDetail(bag);
    const keyboard = createInventoryDetailKeyboard();
    await ctx.reply(message, { reply_markup: keyboard });
  } catch (error) {
    logger.error(`Error handling inventory detail: ${error.message}`, { error, ctx });
    await ctx.reply('Произошла ошибка при получении детальной информации о сумке. Пожалуйста, попробуйте еще раз.');
  }
}

// Другие обработчики...
```

### 2.2. Добавление состояний для роли TECHNICIAN

#### Добавление состояния диагностики:
```javascript
// Добавлено в telegram-bot/src/fsm/states.js
const stateHandlers = {
  // Существующие состояния...
  
  // Новые состояния для TECHNICIAN
  'TECHNICIAN_DIAGNOSTICS': technicianHandlers.handleDiagnostics,
  'TECHNICIAN_DIAGNOSTICS_DETAIL': technicianHandlers.handleDiagnosticsDetail,
  'TECHNICIAN_DIAGNOSTICS_REPAIR': technicianHandlers.handleDiagnosticsRepair,
  'TECHNICIAN_DIAGNOSTICS_CONFIRM': technicianHandlers.handleDiagnosticsConfirm,
  
  // Другие состояния...
};

// Добавлены переходы
const transitions = {
  // Существующие переходы...
  
  // Новые переходы для TECHNICIAN
  'TECHNICIAN_MAIN': {
    'diagnostics': 'TECHNICIAN_DIAGNOSTICS',
    // Другие действия...
  },
  'TECHNICIAN_DIAGNOSTICS': {
    'detail': 'TECHNICIAN_DIAGNOSTICS_DETAIL',
    'back': 'TECHNICIAN_MAIN',
  },
  'TECHNICIAN_DIAGNOSTICS_DETAIL': {
    'repair': 'TECHNICIAN_DIAGNOSTICS_REPAIR',
    'back': 'TECHNICIAN_DIAGNOSTICS',
  },
  'TECHNICIAN_DIAGNOSTICS_REPAIR': {
    'confirm': 'TECHNICIAN_DIAGNOSTICS_CONFIRM',
    'back': 'TECHNICIAN_DIAGNOSTICS_DETAIL',
  },
  'TECHNICIAN_DIAGNOSTICS_CONFIRM': {
    'done': 'TECHNICIAN_DIAGNOSTICS',
    'back': 'TECHNICIAN_DIAGNOSTICS_REPAIR',
  },
  
  // Другие переходы...
};
```

### 2.3. Добавление состояний для роли MANAGER

#### Добавление состояния управления маршрутами:
```javascript
// Добавлено в telegram-bot/src/fsm/states.js
const stateHandlers = {
  // Существующие состояния...
  
  // Новые состояния для MANAGER
  'MANAGER_ROUTES': managerHandlers.handleRoutes,
  'MANAGER_ROUTES_DETAIL': managerHandlers.handleRoutesDetail,
  'MANAGER_ROUTES_EDIT': managerHandlers.handleRoutesEdit,
  'MANAGER_ROUTES_CONFIRM': managerHandlers.handleRoutesConfirm,
  
  // Другие состояния...
};

// Добавлены переходы
const transitions = {
  // Существующие переходы...
  
  // Новые переходы для MANAGER
  'MANAGER_MAIN': {
    'routes': 'MANAGER_ROUTES',
    // Другие действия...
  },
  'MANAGER_ROUTES': {
    'detail': 'MANAGER_ROUTES_DETAIL',
    'back': 'MANAGER_MAIN',
  },
  'MANAGER_ROUTES_DETAIL': {
    'edit': 'MANAGER_ROUTES_EDIT',
    'back': 'MANAGER_ROUTES',
  },
  'MANAGER_ROUTES_EDIT': {
    'confirm': 'MANAGER_ROUTES_CONFIRM',
    'back': 'MANAGER_ROUTES_DETAIL',
  },
  'MANAGER_ROUTES_CONFIRM': {
    'done': 'MANAGER_ROUTES',
    'back': 'MANAGER_ROUTES_EDIT',
  },
  
  // Другие переходы...
};
```

## 3. РЕАЛИЗАЦИЯ НЕДОСТАЮЩИХ ФУНКЦИЙ

### 3.1. Реализация функций для роли WAREHOUSE

#### Реализация полной инвентаризации сумок:
```javascript
// Добавлено в telegram-bot/src/services/bags.js
async function getBags(userId) {
  try {
    const response = await api.get('/bags', { params: { userId } });
    return response.data;
  } catch (error) {
    logger.error(`Error getting bags: ${error.message}`, { error, userId });
    throw new Error('Failed to get bags');
  }
}

async function getBagById(bagId) {
  try {
    const response = await api.get(`/bags/${bagId}`);
    return response.data;
  } catch (error) {
    logger.error(`Error getting bag by id: ${error.message}`, { error, bagId });
    throw new Error('Failed to get bag');
  }
}

async function updateBag(bagId, data) {
  try {
    const response = await api.put(`/bags/${bagId}`, data);
    return response.data;
  } catch (error) {
    logger.error(`Error updating bag: ${error.message}`, { error, bagId, data });
    throw new Error('Failed to update bag');
  }
}

// Другие функции...
```

### 3.2. Реализация функций для роли TECHNICIAN

#### Реализация системы диагностики автоматов:
```javascript
// Добавлено в telegram-bot/src/services/diagnostics.js
async function getDiagnostics(userId) {
  try {
    const response = await api.get('/diagnostics', { params: { userId } });
    return response.data;
  } catch (error) {
    logger.error(`Error getting diagnostics: ${error.message}`, { error, userId });
    throw new Error('Failed to get diagnostics');
  }
}

async function getDiagnosticById(diagnosticId) {
  try {
    const response = await api.get(`/diagnostics/${diagnosticId}`);
    return response.data;
  } catch (error) {
    logger.error(`Error getting diagnostic by id: ${error.message}`, { error, diagnosticId });
    throw new Error('Failed to get diagnostic');
  }
}

async function createRepair(diagnosticId, data) {
  try {
    const response = await api.post(`/diagnostics/${diagnosticId}/repairs`, data);
    return response.data;
  } catch (error) {
    logger.error(`Error creating repair: ${error.message}`, { error, diagnosticId, data });
    throw new Error('Failed to create repair');
  }
}

// Другие функции...
```

### 3.3. Реализация функций для роли MANAGER

#### Реализация управления маршрутами:
```javascript
// Добавлено в telegram-bot/src/services/routes.js
async function getRoutes(userId) {
  try {
    const response = await api.get('/routes', { params: { userId } });
    return response.data;
  } catch (error) {
    logger.error(`Error getting routes: ${error.message}`, { error, userId });
    throw new Error('Failed to get routes');
  }
}

async function getRouteById(routeId) {
  try {
    const response = await api.get(`/routes/${routeId}`);
    return response.data;
  } catch (error) {
    logger.error(`Error getting route by id: ${error.message}`, { error, routeId });
    throw new Error('Failed to get route');
  }
}

async function updateRoute(routeId, data) {
  try {
    const response = await api.put(`/routes/${routeId}`, data);
    return response.data;
  } catch (error) {
    logger.error(`Error updating route: ${error.message}`, { error, routeId, data });
    throw new Error('Failed to update route');
  }
}

// Другие функции...
```

## 4. СИНХРОНИЗАЦИЯ ФУНКЦИОНАЛЬНОСТИ

### 4.1. Добавление функций в веб-интерфейс

#### Добавление управления сумками:
```javascript
// Добавлено в dashboard/bags.html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Управление сумками - VHM24</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header>
    <!-- Шапка сайта -->
  </header>
  
  <main>
    <h1>Управление сумками</h1>
    
    <div class="bags-container">
      <div class="bags-list">
        <!-- Список сумок будет загружен с помощью JavaScript -->
      </div>
      
      <div class="bags-detail">
        <!-- Детальная информация о сумке будет загружена с помощью JavaScript -->
      </div>
    </div>
  </main>
  
  <footer>
    <!-- Подвал сайта -->
  </footer>
  
  <script src="js/bags.js"></script>
</body>
</html>
```

```javascript
// Добавлено в dashboard/js/bags.js
document.addEventListener('DOMContentLoaded', function() {
  loadBags();
  
  // Обработчики событий для кнопок
  document.querySelector('.bags-list').addEventListener('click', function(event) {
    if (event.target.classList.contains('bag-item')) {
      const bagId = event.target.dataset.id;
      loadBagDetail(bagId);
    }
  });
});

async function loadBags() {
  try {
    const response = await fetch('/api/bags');
    const bags = await response.json();
    
    const bagsList = document.querySelector('.bags-list');
    bagsList.innerHTML = '';
    
    bags.forEach(bag => {
      const bagItem = document.createElement('div');
      bagItem.classList.add('bag-item');
      bagItem.dataset.id = bag.id;
      bagItem.innerHTML = `
        <h3>${bag.name}</h3>
        <p>Статус: ${bag.status}</p>
      `;
      bagsList.appendChild(bagItem);
    });
  } catch (error) {
    console.error('Error loading bags:', error);
    alert('Произошла ошибка при загрузке сумок. Пожалуйста, попробуйте еще раз.');
  }
}

async function loadBagDetail(bagId) {
  try {
    const response = await fetch(`/api/bags/${bagId}`);
    const bag = await response.json();
    
    const bagDetail = document.querySelector('.bags-detail');
    bagDetail.innerHTML = `
      <h2>${bag.name}</h2>
      <p>Статус: ${bag.status}</p>
      <p>Местоположение: ${bag.location}</p>
      <p>Последнее обновление: ${new Date(bag.updatedAt).toLocaleString()}</p>
      
      <h3>Содержимое:</h3>
      <ul>
        ${bag.items.map(item => `<li>${item.name}: ${item.quantity}</li>`).join('')}
      </ul>
      
      <div class="bag-actions">
        <button class="btn btn-primary" onclick="editBag(${bag.id})">Редактировать</button>
        <button class="btn btn-danger" onclick="deleteBag(${bag.id})">Удалить</button>
      </div>
    `;
  } catch (error) {
    console.error('Error loading bag detail:', error);
    alert('Произошла ошибка при загрузке детальной информации о сумке. Пожалуйста, попробуйте еще раз.');
  }
}

// Другие функции...
```

#### Добавление календаря задач:
```javascript
// Добавлено в dashboard/tasks-calendar.html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Календарь задач - VHM24</title>
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/calendar.css">
</head>
<body>
  <header>
    <!-- Шапка сайта -->
  </header>
  
  <main>
    <h1>Календарь задач</h1>
    
    <div class="calendar-container">
      <div class="calendar-header">
        <button id="prev-month">&lt;</button>
        <h2 id="current-month">Июль 2025</h2>
        <button id="next-month">&gt;</button>
      </div>
      
      <div class="calendar-grid">
        <!-- Календарь будет загружен с помощью JavaScript -->
      </div>
    </div>
    
    <div class="tasks-for-day">
      <h2 id="selected-day">Задачи на 16 июля 2025</h2>
      <div class="tasks-list">
        <!-- Список задач будет загружен с помощью JavaScript -->
      </div>
    </div>
  </main>
  
  <footer>
    <!-- Подвал сайта -->
  </footer>
  
  <script src="js/tasks-calendar.js"></script>
</body>
</html>
```

```javascript
// Добавлено в dashboard/js/tasks-calendar.js
document.addEventListener('DOMContentLoaded', function() {
  const today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  
  renderCalendar(currentMonth, currentYear);
  loadTasksForDay(today);
  
  // Обработчики событий для кнопок
  document.getElementById('prev-month').addEventListener('click', function() {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
  });
  
  document.getElementById('next-month').addEventListener('click', function() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  });
  
  document.querySelector('.calendar-grid').addEventListener('click', function(event) {
    if (event.target.classList.contains('calendar-day')) {
      const day = parseInt(event.target.textContent);
      const date = new Date(currentYear, currentMonth, day);
      loadTasksForDay(date);
    }
  });
});

function renderCalendar(month, year) {
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
  
  const calendarGrid = document.querySelector('.calendar-grid');
  calendarGrid.innerHTML = '';
  
  // Добавление дней недели
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  daysOfWeek.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day-header');
    dayElement.textContent = day;
    calendarGrid.appendChild(dayElement);
  });
  
  // Добавление пустых ячеек для дней до начала месяца
  for (let i = 0; i < firstDayOfMonth; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.classList.add('calendar-day', 'empty');
    calendarGrid.appendChild(emptyDay);
  }
  
  // Добавление дней месяца
  for (let i = 1; i <= daysInMonth; i++) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day');
    dayElement.textContent = i;
    
    // Выделение текущего дня
    const today = new Date();
    if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayElement.classList.add('today');
    }
    
    calendarGrid.appendChild(dayElement);
  }
}

async function loadTasksForDay(date) {
  try {
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const response = await fetch(`/api/tasks?date=${formattedDate}`);
    const tasks = await response.json();
    
    document.getElementById('selected-day').textContent = `Задачи на ${date.getDate()} ${['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][date.getMonth()]} ${date.getFullYear()}`;
    
    const tasksList = document.querySelector('.tasks-list');
    tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
      tasksList.innerHTML = '<p>Нет задач на выбранный день</p>';
      return;
    }
    
    tasks.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.classList.add('task-item');
      taskElement.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p>Приоритет: ${task.priority}</p>
        <p>Статус: ${task.status}</p>
        <button class="btn btn-primary" onclick="viewTask(${task.id})">Просмотреть</button>
      `;
      tasksList.appendChild(taskElement);
    });
  } catch (error) {
    console.error('Error loading tasks for day:', error);
    alert('Произошла ошибка при загрузке задач. Пожалуйста, попробуйте еще раз.');
  }
}

// Другие функции...
```

### 4.2. Добавление функций в Telegram-бот

#### Добавление расширенной аналитики:
```javascript
// Добавлено в telegram-bot/src/handlers/manager/analytics.js
async function handleAnalytics(ctx) {
  try {
    const analyticsTypes = [
      { id: 'sales', name: 'Продажи' },
      { id: 'operators', name: 'Эффективность операторов' },
      { id: 'machines', name: 'Эффективность автоматов' },
      { id: 'products', name: 'Популярность продуктов' },
      { id: 'regions', name: 'Анализ по регионам' },
    ];
    
    const message = 'Выберите тип аналитики:';
    const keyboard = createAnalyticsKeyboard(analyticsTypes);
    
    await ctx.reply(message, { reply_markup: keyboard });
  } catch (error) {
    logger.error(`Error handling analytics: ${error.message}`, { error, ctx });
    await ctx.reply('Произошла ошибка при загрузке аналитики. Пожалуйста, попробуйте еще раз.');
  }
}

async function handleAnalyticsType(ctx, type) {
  try {
    const periods = [
      { id: 'day', name: 'День' },
      { id: 'week', name: 'Неделя' },
      { id: 'month', name: 'Месяц' },
      { id: 'quarter', name: 'Квартал' },
      { id: 'year', name: 'Год' },
    ];
    
    ctx.session.analyticsType = type;
    
    const message = 'Выберите период:';
    const keyboard = createPeriodKeyboard(periods);
    
    await ctx.reply(message, { reply_markup: keyboard });
  } catch (error) {
    logger.error(`Error handling analytics type: ${error.message}`, { error, ctx, type });
    await ctx.reply('Произошла ошибка при выборе типа аналитики. Пожалуйста, попробуйте еще раз.');
  }
}

async function handleAnalyticsPeriod(ctx, period) {
  try {
    const type = ctx.session.analyticsType;
    const analytics = await analyticsService.getAnalytics(type, period);
    
    const message = formatAnalytics(analytics, type, period);
    const keyboard = createBackKeyboard();
    
    await ctx.reply(message, { reply_markup: keyboard });
    
    // Отправка графика
    const chartBuffer = await analyticsService.getAnalyticsChart(type, period);
    await ctx.replyWithPhoto({ source: chartBuffer });
  } catch (error) {
    logger.error(`Error handling analytics period: ${error.message}`, { error, ctx, period });
    await ctx.reply('Произошла ошибка при загрузке аналитики. Пожалуйста, попробуйте еще раз.');
  }
}

// Вспомогательные функции
function createAnalyticsKeyboard(types) {
  const keyboard = {
    inline_keyboard: []
  };
  
  types.forEach(type => {
    keyboard.inline_keyboard.push([
      { text: type.name, callback_data: `analytics_type:${type.id}` }
    ]);
  });
  
  keyboard.inline_keyboard.push([
    { text: 'Назад', callback_data: 'back' }
  ]);
  
  return keyboard;
}

function createPeriodKeyboard(periods) {
  const keyboard = {
    inline_keyboard: []
  };
  
  periods.forEach(period => {
    keyboard.inline_keyboard.push([
      { text: period.name, callback_data: `analytics_period:${period.id}` }
    ]);
  });
  
  keyboard.inline_keyboard.push([
    { text: 'Назад', callback_data: 'back' }
  ]);
  
  return keyboard;
}

function createBackKeyboard() {
  return {
    inline_keyboard: [
      [{ text: 'Назад', callback_data: 'back' }]
    ]
  };
}

function formatAnalytics(analytics, type, period) {
  // Форматирование аналитики в зависимости от типа и периода
  // ...
}

module.exports = {
  handleAnalytics,
  handleAnalyticsType,
  handleAnalyticsPeriod,
};
```

## 5. УЛУЧШЕНИЕ АРХИТЕКТУРЫ

### 5.1. Выделение общих
