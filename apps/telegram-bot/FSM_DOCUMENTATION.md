# Документация по FSM-сценариям VendHubBot

## Общая информация

Система VendHubBot использует **конечные автоматы (FSM)** как центральный элемент своей архитектуры для организации и контроля всех рабочих процессов в Telegram-боте. Вся логика работы бота построена на пошаговых FSM-сценариях, что обеспечивает интуитивно понятное взаимодействие с пользователем через кнопки и минимизирует ошибки. FSM-логика и права доступа настраиваются динамически через JSON-модели.

## Общие FSM-состояния и логика

В системе предусмотрены общие FSM-состояния, которые могут быть интегрированы в различные сценарии:

### Типы ввода

- **type: text_input**: Для текстовых комментариев или описаний.
- **type: num_input**: Для числовых значений (вес, количество, сумма) с inline-цифровой клавиатурой.
- **type: select**: Для выбора из inline-списка.
- **type: media_upload**: Для загрузки фото/видео/аудио.
- **type: confirm**: Для подтверждения действия, с кнопками "Подтвердить" / "Отменить" / "Назад".
- **type: submit**: Автоматическая отправка данных с сообщением об успехе.
- **type: redirect**: Автоматический переход к другому FSM (например, к error_fsm при ошибке).

### Универсальные кнопки

- **Кнопка "Назад"**: Возвращает в предыдущее меню, не удаляет главное меню.
- **Кнопка "Завершить"**: Завершает текущее действие и возвращает в главное меню, с предупреждением о несохраненных данных.
- **Кнопка "Отменить"**: Отменяет текущий ввод и возвращает к последнему экрану выбора.

## Интеграция FSM-хелперов

Для интеграции общих FSM-состояний и логики во все FSM-сценарии используется модуль `fsm-integrator.js`. Он добавляет middleware для обработки всех типов ввода во все сцены.

```javascript
// Импорт интегратора FSM-хелперов
const { integrateAllScenes } = require('../utils/fsm-integrator');

// Интегрируем FSM-хелперы во все сцены
const integratedScenes = integrateAllScenes(allScenes);
```

## FSM-сценарии

### 1. FSM: main_menu_fsm

**Назначение**: Отображение **главного меню**, динамически адаптирующегося под роль пользователя.

**Роли**: Все пользователи.

**Состояния**:
- `auth_check`: проверка Telegram ID и роли пользователя.
- `main_menu`: отображение кнопок главного меню в зависимости от роли.

**Переходы**: К соответствующему FSM по выбору кнопки.

### 2. FSM: task_create_fsm

**Назначение**: **Создание новых задач** (для оператора, техника, склада).

**Роли**: Менеджер.

**Состояния**: 
- `task_select_type`
- `task_select_machine`
- `task_select_items` (ингредиенты, сиропы, вода, миксеры)
- `task_select_deadline`
- `task_select_checklist_template`
- `task_assign_executor`
- `task_confirm_create`
- `task_success`
- `task_error`

### 3. FSM: task_execution_fsm

**Назначение**: **Выполнение назначенной задачи** по чек-листу.

**Роли**: Оператор, Техник.

**Состояния**: 
- `task_list_assigned`
- `task_view_details`
- `task_start`
- `task_photo_before`
- `task_input_weights`
- `task_input_units`
- `task_photo_after`
- `task_finish`
- `task_error_report`

### 4. FSM: checklist_fsm

**Назначение**: Пошаговое **прохождение чек-листа** в рамках задачи.

**Роли**: Все исполнители задач (Оператор, Кладовщик, Техник).

**Состояния**: 
- `checklist_load_template`
- `checklist_item_check` (циклическое выполнение каждого пункта)
- `checklist_confirm`
- `checklist_reject`

### 5. FSM: bag_fsm

**Назначение**: **Формирование сумок-комплектов** для оператора.

**Роли**: Складской работник (Warehouse).

**Состояния**: 
- `bag_select_machine`
- `bag_add_hoppers`
- `bag_add_syrups`
- `bag_add_water`
- `bag_add_extras`
- `bag_photo`
- `bag_confirm`
- `bag_dispatch`

### 6. FSM: warehouse_receive_fsm

**Назначение**: **Приём новых ингредиентов**, товаров, бутылок воды на склад.

**Роли**: Складской работник (Warehouse).

**Состояния**: 
- `receive_select_type`
- `receive_input_quantity_or_weight`
- `receive_photo`
- `receive_confirm`

### 7. FSM: warehouse_return_fsm

**Назначение**: **Приём возвратов от оператора** (сумок с бункерами, использованных бутылок воды, сиропов).

**Роли**: Складской работник (Warehouse).

**Состояния**: 
- `return_select_task`
- `return_select_bag`
- `return_input_weights`
- `return_photo`
- `return_finish`

### 8. FSM: warehouse_check_inventory_fsm

**Назначение**: **Проведение инвентаризации** складских запасов.

**Роли**: Складской работник (Warehouse).

**Состояния**: 
- `inventory_select_type`
- `inventory_select_item`
- `inventory_input_data`
- `inventory_photo`
- `inventory_finish`

### 9. FSM: cash_fsm

**Назначение**: **Учёт инкассации** и сверка наличности.

**Роли**: Оператор (ввод), Менеджер (проверка).

**Состояния**: 
- `cash_select_machine`
- `cash_input_amount`
- `cash_upload_photo`
- `cash_confirm`
- `cash_reconciliation_manager`

### 10. FSM: retro_fsm

**Назначение**: **Ретроспективный ввод данных** (действий, произошедших в прошлом).

**Роли**: Все исполнители (Кладовщик, Оператор).

**Состояния**: 
- `retro_select_action`
- `retro_select_date`
- `retro_input_data`
- `retro_photo_optional`
- `retro_confirm`

### 11. FSM: error_fsm

**Назначение**: **Фиксация ошибок и проблем** (например, пропущенных фото, несоответствий).

**Роли**: Все исполнители.

**Состояния**: 
- `error_select_reason`
- `error_comment`
- `error_photo_optional`
- `error_submit`

### 12. FSM: import_fsm

**Назначение**: **Загрузка отчётов из внешних систем** (например, Excel-файлов по продажам) для сверки.

**Роли**: Менеджер.

**Состояния**: 
- `import_select_type`
- `import_upload_file`
- `import_auto_reconciliation`
- `import_auto_generate_tasks`
- `import_confirm_finish`

### 13. FSM: directory_fsm

**Назначение**: **Управление всеми справочниками** в системе (создание, редактирование, удаление объектов).

**Роли**: Менеджер, Администратор.

**Состояния**: 
- `dir_select_category`
- `dir_list_entries`
- `dir_view_entry`
- `dir_add_entry`
- `dir_edit_entry`
- `dir_delete_entry`

### 14. FSM: user_fsm

**Назначение**: **Управление пользователями** системы (создание, редактирование, назначение ролей, блокировка).

**Роли**: Администратор.

**Состояния**: 
- `user_list`
- `user_view_details`
- `user_add`
- `user_edit`
- `user_assign_role`
- `user_toggle_status`
- `user_view_logs`

### 15. FSM: report_fsm

**Назначение**: **Генерация и просмотр отчётов** на основе собранных данных.

**Роли**: Менеджер, Администратор.

**Состояния**: 
- `report_select_type`
- `report_filter_period`
- `report_filter_machine`
- `report_filter_item`
- `report_export_format`
- `report_generate_result`

### 16. FSM: finance_fsm

**Назначение**: **Учёт доходов, расходов и баланса** компании.

**Роли**: Менеджер, Администратор.

**Состояния**: 
- `finance_menu`
- `finance_add_income`
- `finance_add_expense`
- `finance_view_balance`
- `finance_view_history`

### 17. FSM: admin_fsm

**Назначение**: **Системные настройки и управление** (права доступа, уведомления, сброс данных).

**Роли**: Администратор.

**Состояния**: 
- `admin_menu`
- `settings_system`
- `settings_roles`
- `settings_users`
- `settings_logs`
- `settings_notifications`
- `settings_reset_data`

## Использование FSM-хелперов в сценариях

Для использования общих FSM-состояний и логики в сценариях можно использовать функции из модуля `fsm-helpers.js`:

```javascript
const { 
  createTextInput, 
  createNumInput, 
  createSelect, 
  createMediaUpload, 
  createConfirm, 
  createSubmit, 
  createRedirect 
} = require('../utils/fsm-helpers');

// Пример использования текстового ввода
await createTextInput(ctx, 'Введите комментарий:', async (text) => {
  // Обработка введенного текста
  ctx.session.comment = text;
  await ctx.reply(`Вы ввели: ${text}`);
  // Переход к следующему состоянию
  await nextState(ctx);
});

// Пример использования числового ввода
await createNumInput(ctx, 'Введите количество:', async (value) => {
  // Обработка введенного числа
  ctx.session.quantity = value;
  await ctx.reply(`Вы ввели: ${value}`);
  // Переход к следующему состоянию
  await nextState(ctx);
}, { min: 1, max: 100, allowFloat: false });

// Пример использования выбора из списка
const items = [
  { id: '1', name: 'Элемент 1' },
  { id: '2', name: 'Элемент 2' },
  { id: '3', name: 'Элемент 3' }
];

await createSelect(ctx, 'Выберите элемент:', items, async (selectedItem) => {
  // Обработка выбранного элемента
  ctx.session.selectedItem = selectedItem;
  await ctx.reply(`Вы выбрали: ${selectedItem.name}`);
  // Переход к следующему состоянию
  await nextState(ctx);
}, { multiSelect: false });

// Пример использования загрузки медиафайлов
await createMediaUpload(ctx, 'Загрузите фото:', async (media) => {
  // Обработка загруженного медиафайла
  ctx.session.mediaFileId = media.fileId;
  await ctx.reply(`Фото загружено с ID: ${media.fileId}`);
  // Переход к следующему состоянию
  await nextState(ctx);
}, { mediaTypes: ['photo'] });

// Пример использования подтверждения
await createConfirm(ctx, 'Подтвердите действие:', async () => {
  // Обработка подтверждения
  await ctx.reply('Действие подтверждено');
  // Переход к следующему состоянию
  await nextState(ctx);
}, async () => {
  // Обработка отмены
  await ctx.reply('Действие отменено');
  // Возврат к предыдущему состоянию
  await prevState(ctx);
}, async () => {
  // Обработка кнопки "Назад"
  await ctx.reply('Возврат к предыдущему шагу');
  // Возврат к предыдущему состоянию
  await prevState(ctx);
});

// Пример использования автоматической отправки данных
await createSubmit(ctx, 'Данные успешно отправлены', async (data) => {
  // Обработка отправки данных
  await saveData(data);
  // Переход к следующему состоянию
  await nextState(ctx);
}, ctx.session.data);

// Пример использования перенаправления к другому FSM
await createRedirect(ctx, 'Перенаправление к обработке ошибок', 'error_fsm', {
  errorType: 'validation',
  errorMessage: 'Ошибка валидации данных'
});
```

## Заключение

Все описанные сценарии, их состояния и переходы готовы для использования в Telegram-боте VendHubBot. Общие FSM-состояния и логика интегрированы во все сценарии, что обеспечивает единообразие интерфейса и упрощает поддержку кода.
