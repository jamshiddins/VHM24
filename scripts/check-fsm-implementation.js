const fs = require('fs');
const path = require('path');

// Функция для проверки реализации FSM
function checkFsmImplementation() {
  console.log('Проверка реализации FSM...');
  
  try {
    // Проверка наличия файла states.js
    const statesFilePath = path.join(__dirname, '..', 'telegram-bot', 'src', 'fsm', 'states.js');
    if (!fs.existsSync(statesFilePath)) {
      console.error(`Ошибка: Файл ${statesFilePath} не найден.`);
      process.exit(1);
    }
    
    // Чтение файла states.js
    const statesContent = fs.readFileSync(statesFilePath, 'utf8');
    
    // Проверка наличия всех необходимых состояний
    const requiredStates = [
      // Основные состояния
      'IDLE', 'MAIN_MENU',
      
      // Состояния для оператора
      'OPERATOR_MENU', 'OPERATOR_TASKS', 'OPERATOR_TASK_EXECUTION', 
      'OPERATOR_CHECKLIST', 'OPERATOR_BAG_RETURN', 'OPERATOR_INCASSATION', 
      'OPERATOR_REPORT',
      
      // Состояния для склада
      'WAREHOUSE_MENU', 'WAREHOUSE_BAGS', 'WAREHOUSE_INVENTORY', 
      'WAREHOUSE_RECEIVE', 'WAREHOUSE_WASH',
      
      // Состояния для менеджера
      'MANAGER_MENU', 'MANAGER_CREATE_TASK', 'MANAGER_ASSIGN_TASK', 
      'MANAGER_ANALYTICS', 'MANAGER_REPORTS', 'MANAGER_ALERTS', 
      'MANAGER_ROUTES',
      
      // Состояния для техника
      'TECHNICIAN_MENU', 'TECHNICIAN_REPAIR', 'TECHNICIAN_MAINTENANCE', 
      'TECHNICIAN_DIAGNOSTICS'
    ];
    
    const missingStates = [];
    
    for (const state of requiredStates) {
      if (!statesContent.includes(`"${state}"`)) {
        missingStates.push(state);
      }
    }
    
    if (missingStates.length > 0) {
      console.warn(`Предупреждение: Отсутствуют следующие состояния: ${missingStates.join(', ')}`);
    } else {
      console.log('✅ Все необходимые состояния определены в states.js');
    }
    
    // Проверка обработчиков для каждой роли
    const roles = ['operator', 'warehouse', 'manager', 'technician'];
    
    for (const role of roles) {
      const handlerFilePath = path.join(__dirname, '..', 'telegram-bot', 'src', 'handlers', role, 'index.js');
      
      if (!fs.existsSync(handlerFilePath)) {
        console.error(`Ошибка: Файл обработчиков для роли ${role} не найден: ${handlerFilePath}`);
        continue;
      }
      
      const handlerContent = fs.readFileSync(handlerFilePath, 'utf8');
      
      // Проверка наличия обработчиков для каждого состояния
      const roleStates = requiredStates.filter(state => state.startsWith(role.toUpperCase()));
      const missingHandlers = [];
      
      for (const state of roleStates) {
        const stateKey = state.toLowerCase().replace(/_/g, '');
        if (!handlerContent.includes(stateKey)) {
          missingHandlers.push(state);
        }
      }
      
      if (missingHandlers.length > 0) {
        console.warn(`Предупреждение: Отсутствуют обработчики для следующих состояний роли ${role}: ${missingHandlers.join(', ')}`);
      } else {
        console.log(`✅ Все необходимые обработчики для роли ${role} реализованы`);
      }
    }
    
    console.log('Проверка реализации FSM завершена.');
  } catch (error) {
    console.error('Ошибка при проверке реализации FSM:', error);
    process.exit(1);
  }
}

// Запуск проверки реализации FSM
checkFsmImplementation();
