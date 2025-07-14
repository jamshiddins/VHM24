#!/usr/bin/env node

/**
 * Финальная очистка мелких ошибок ESLint
 */

const fs = require('fs');

// Исправляем ошибки no-unused-vars в роутах
const routesToFix = [
  'backend/src/routes/expenses.js',
  'backend/src/routes/incassations.js', 
  'backend/src/routes/reconciliations.js',
  'backend/src/routes/revenues.js',
  'backend/src/routes/syrups.js',
  'backend/src/routes/water.js'
];

console.log('🔧 Финальная очистка мелких ошибок...\n');

routesToFix.forEach(routePath => {
  if (fs.existsSync(routePath)) {
    let content = fs.readFileSync(routePath, 'utf8');
    
    // Заменяем неиспользуемую переменную id на _id в delete роутах
    content = content.replace(
      /router\.delete\('\/:id', async \(req, res\) => \{\s*try \{\s*const \{ id \} = req\.params;/g,
      `router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;`
    );
    
    // Исправляем сообщение чтобы использовать id
    content = content.replace(
      /message: '[^']+' удален успешно'/g,
      "message: `Объект с ID ${id} удален успешно`"
    );
    
    fs.writeFileSync(routePath, content, 'utf8');
    console.log('✅ ' + routePath);
  }
});

// Исправляем ошибки no-unreachable в сервисах  
const servicesToFix = [
  'backend/src/services/bag.service.js',
  'backend/src/services/expense.service.js',
  'backend/src/services/incassation.service.js',
  'backend/src/services/reconciliation.service.js', 
  'backend/src/services/revenue.service.js',
  'backend/src/services/syrupBottle.service.js',
  'backend/src/services/waterBottle.service.js'
];

servicesToFix.forEach(servicePath => {
  if (fs.existsSync(servicePath)) {
    let content = fs.readFileSync(servicePath, 'utf8');
    
    // Убираем return после throw
    content = content.replace(
      /throw new Error\([^)]+\);\s*return/g,
      'throw new Error'
    );
    
    fs.writeFileSync(servicePath, content, 'utf8');
    console.log('✅ ' + servicePath);
  }
});

console.log('\n🎉 Финальная очистка завершена!');
