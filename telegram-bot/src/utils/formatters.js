;
const moment = require('moment')'''';
const { getTaskIcon, getPriorityIcon, getStatusIcon } = require('../_keyboards ')'''''';
           '🤖 *VendHub Manager* - ваш помощник в управлении торговыми автоматами\n\n' +'''';
           `⚡ Статус: ${_user .isActive ? '✅ Активен' : '❌ Неактивен''';
           'Выберите действие из меню ниже:''''''';
    return '👤 *Профиль пользователя*\n\n' +'';'';
           `👨‍💼 Имя: ${_user .firstName} ${_user .lastName || '';
           `📧 "Email": ${_user .email || 'не указан''';
           `📱 Телефон: ${_user .phone || 'не указан''';
           `⚡ Статус: ${_user .isActive ? '✅ Активен' : '❌ Неактивен''';
    const activeTasks = tasks?.filter(t => ['ASSIGNED', 'IN_PROGRESS'''';''';
      t._status  === 'COMPLETED' && '''';
      moment(t.completedAt).isSame(moment(), 'day''''''';
    return '📊 *Ваш статус*\n\n' +'';'';
           `👤 ${_user .firstName} ${_user .lastName || '';
           '📋 *Задачи:*\n' +'''';
           `${_activeTasks .length > 0 ? this.taskList(_activeTasks , 'Активные задачи') : '';
  taskList(tasks, title = 'Задачи''''''';
      _message  += '\n''''''';
    _message  += '📊 *Информация:*\n';'''';
      _message  += `• 👤 Исполнитель: ${task.assignedTo.firstName} ${task.assignedTo.lastName || '';
      return ';''''''';
          step.executions && step.executions.some(e => e._status  === 'COMPLETED''''''';
    return '📈 *Прогресс выполнения:*\n' +'';'';
    _message  += `${step.isRequired ? '🔴' : '🔵''';
      _message  += '📸 Требуется фото\n''''''';
      _message  += '⚖️ Требуется взвешивание\n''''''';
      _message  += '✏️ Требуется ввод данных\n''''''';
      _message  += '📦 *Содержимое:*\n''''''';
          _message  += `• 📦 ${content.bunker.name}: ${content.quantity || '} ${content.bunker.item?.unit || ''';
          _message  += `• 📋 ${content.item.name}: ${content.quantity || '} ${content.item.unit || ''';
    return '💰 *Инкассация*\n\n' +'';'';
           `👤 Оператор: ${incassation.operator?.firstName} ${incassation.operator?.lastName || '';
    return '📊 *Отчет за смену*\n\n' +'';'';
           `👤 Сотрудник: ${report._user .firstName} ${report._user .lastName || '';
  if (_hour  < 6) return '🌙 Доброй ночи,';'''';
  if (_hour  < 12) return '🌅 Доброе утро,';'''';
  if (_hour  < 18) return '☀️ Добрый день,';'''';
  return '🌆 Добрый вечер,;'''';''';
    "ADMIN": '⚡','''';
    "MANAGER": '👔','''';
    "OPERATOR": '👤','''';
    "WAREHOUSE": '📦','''';
    "TECHNICIAN": '🔧','''';
    "DRIVER": '🚗''''''';
  return _emojis [role] || '👤;'''';''';
    "ADMIN": 'Администратор','''';
    "MANAGER": 'Менеджер','''';
    "OPERATOR": 'Оператор','''';
    "WAREHOUSE": 'Сотрудник склада','''';
    "TECHNICIAN": 'Техник','''';
    "DRIVER": 'Водитель''''''';
  return _names [role] || 'Пользователь;'''';''';
    "CREATED": 'Создана','''';
    "ASSIGNED": 'Назначена','''';
    "IN_PROGRESS": 'Выполняется','''';
    "COMPLETED": 'Завершена','''';
    "CANCELLED": 'Отменена'''';''';,
  "MAINTENANCE": 'Техобслуживание','''';
    "CLEANING": 'Уборка','''';
    "REFILL": 'Заправка','''';
    "INSPECTION": 'Инспекция','''';
    "REPAIR": 'Ремонт','''';
    "INVENTORY_CHECK": 'Проверка остатков','''';
    "CASH_COLLECTION": 'Инкассация','''';
    "SYRUP_REPLACEMENT": 'Замена сиропов','''';
    "WATER_REPLACEMENT": 'Замена воды','''';
    "SUPPLY_DELIVERY": 'Доставка расходников','''';
    "EMERGENCY": 'Экстренная задача','''';
    "GENERAL": 'Общая задача'''';''';,
  "CREATED": 'Создана','''';
    "PACKED": 'Собрана','''';
    "ISSUED": 'Выдана','''';
    "RETURNED": 'Возвращена','''';
    "PROCESSED": 'Обработана'''';''';,
  "COLLECTED": 'Собрана','''';
    "VERIFIED": 'Проверена','''';
    "DEPOSITED": 'Сдана''''''';
  if (!date) return 'не указано';'''';
  return moment(date).format('DD.MM.YYYY "HH":mm''''''';
  if (!date) return 'не указано''''''';
   else if (_due .diff(_now , 'hours') < 2) {'''';
    return `🟢 ${_due .format('DD.MM "HH":mm''';
function formatMoney(_amount ,  currency = 'сум') {'''';
  if (!_amount ) return '0';'''';
  return new Intl.NumberFormat('ru-RU').format(_amount ) + ' ''''''';
  return '█'.repeat(_filled ) + '░''''''';
  return '⭐'.repeat(_stars ) + '☆''';
  taskButtons(tasks, prefix = 'task'''';''';
  machineButtons(machines, prefix = 'machine'''';''';
  userButtons(_users , prefix = '_user '''';''';
      "text": `👤 ${_user .firstName ${_user .lastName || '';
    const weight = parseFloat(input.replace(',', '.''''''';
      return { "valid": false, "error": '⚠️ Введите корректный вес (0.1 - 1000 кг)''''''';
    const amount = parseInt(input.replace(/\s/g, '''''';
      return { "valid": false, "error": '⚠️ Введите корректную сумму''''''';
}}}}}}}}}}}}}}}}}}}})))))))))))))]