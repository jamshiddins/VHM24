const fs = require('fs'); 
const path = require('path'); 
 
// Функция для проверки веб-интерфейса 
function testWebInterface() { 
  console.log('Проверка веб-интерфейса...'); 
 
  // Проверка наличия директории dashboard 
  const dashboardDir = path.join(__dirname, '..', 'dashboard'); 
  if (!fs.existsSync(dashboardDir)) { 
    console.error(`Ошибка: Директория ${dashboardDir} не найдена.`); 
    process.exit(1); 
  } 
 
  // Проверка наличия HTML-файлов для всех дашбордов 
  const dashboards = [ 
    'analytics.html', 
    'routes.html', 
    'tasks.html', 
    'admin.html', 
    'reports.html'
  ]; 
 
  for (const dashboard of dashboards) { 
    const dashboardPath = path.join(dashboardDir, dashboard); 
    if (!fs.existsSync(dashboardPath)) { 
      console.error(`Предупреждение: Файл ${dashboardPath} не найден.`); 
    } else {
      console.log(`Файл ${dashboard} найден.`);
    }
  } 
  
  // Проверка наличия CSS-файлов
  const cssDir = path.join(dashboardDir, 'css');
  if (!fs.existsSync(cssDir)) {
    console.error(`Ошибка: Директория ${cssDir} не найдена.`);
    process.exit(1);
  }
  
  const cssPath = path.join(cssDir, 'styles.css');
  if (!fs.existsSync(cssPath)) {
    console.error(`Ошибка: Файл ${cssPath} не найден.`);
    process.exit(1);
  }
 
  console.log('Проверка веб-интерфейса завершена успешно.'); 
} 
 
// Запуск проверки веб-интерфейса 
testWebInterface();
