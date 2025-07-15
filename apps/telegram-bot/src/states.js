/**
 * Константы состояний для FSM-сценариев
 */

// Главное меню
const MAIN_MENU_STATES = {
  AUTH_CHECK: 'auth_check',
  MAIN_MENU: 'main_menu'
};

// Создание задач
const TASK_CREATE_STATES = {
  SELECT_TYPE: 'task_select_type',
  SELECT_MACHINE: 'task_select_machine',
  SELECT_ITEMS: 'task_select_items',
  SELECT_DEADLINE: 'task_select_deadline',
  SELECT_CHECKLIST_TEMPLATE: 'task_select_checklist_template',
  ASSIGN_EXECUTOR: 'task_assign_executor',
  CONFIRM_CREATE: 'task_confirm_create',
  SUCCESS: 'task_success',
  ERROR: 'task_error'
};

// Выполнение задач
const TASK_EXECUTION_STATES = {
  LIST_ASSIGNED: 'task_list_assigned',
  VIEW_DETAILS: 'task_view_details',
  START: 'task_start',
  PHOTO_BEFORE: 'task_photo_before',
  INPUT_WEIGHTS: 'task_input_weights',
  INPUT_UNITS: 'task_input_units',
  PHOTO_AFTER: 'task_photo_after',
  FINISH: 'task_finish',
  ERROR_REPORT: 'task_error_report'
};

// Чек-лист
const CHECKLIST_STATES = {
  LOAD_TEMPLATE: 'checklist_load_template',
  ITEM_CHECK: 'checklist_item_check',
  CONFIRM: 'checklist_confirm',
  REJECT: 'checklist_reject'
};

// Формирование сумок
const BAG_STATES = {
  SELECT_MACHINE: 'bag_select_machine',
  ADD_HOPPERS: 'bag_add_hoppers',
  ADD_SYRUPS: 'bag_add_syrups',
  ADD_WATER: 'bag_add_water',
  ADD_EXTRAS: 'bag_add_extras',
  PHOTO: 'bag_photo',
  CONFIRM: 'bag_confirm',
  DISPATCH: 'bag_dispatch'
};

// Приём на склад
const WAREHOUSE_RECEIVE_STATES = {
  SELECT_TYPE: 'receive_select_type',
  INPUT_QUANTITY_OR_WEIGHT: 'receive_input_quantity_or_weight',
  PHOTO: 'receive_photo',
  CONFIRM: 'receive_confirm'
};

// Возврат на склад
const WAREHOUSE_RETURN_STATES = {
  SELECT_TASK: 'return_select_task',
  SELECT_BAG: 'return_select_bag',
  INPUT_WEIGHTS: 'return_input_weights',
  PHOTO: 'return_photo',
  FINISH: 'return_finish'
};

// Инвентаризация
const WAREHOUSE_INVENTORY_STATES = {
  SELECT_TYPE: 'inventory_select_type',
  SELECT_ITEM: 'inventory_select_item',
  INPUT_DATA: 'inventory_input_data',
  PHOTO: 'inventory_photo',
  FINISH: 'inventory_finish'
};

// Инкассация
const CASH_STATES = {
  SELECT_MACHINE: 'cash_select_machine',
  INPUT_AMOUNT: 'cash_input_amount',
  UPLOAD_PHOTO: 'cash_upload_photo',
  CONFIRM: 'cash_confirm',
  RECONCILIATION_MANAGER: 'cash_reconciliation_manager'
};

// Ретроспективный ввод
const RETRO_STATES = {
  SELECT_ACTION: 'retro_select_action',
  SELECT_DATE: 'retro_select_date',
  INPUT_DATA: 'retro_input_data',
  PHOTO_OPTIONAL: 'retro_photo_optional',
  CONFIRM: 'retro_confirm'
};

// Фиксация ошибок
const ERROR_STATES = {
  SELECT_REASON: 'error_select_reason',
  COMMENT: 'error_comment',
  PHOTO_OPTIONAL: 'error_photo_optional',
  SUBMIT: 'error_submit'
};

// Импорт данных
const IMPORT_STATES = {
  SELECT_TYPE: 'import_select_type',
  UPLOAD_FILE: 'import_upload_file',
  AUTO_RECONCILIATION: 'import_auto_reconciliation',
  AUTO_GENERATE_TASKS: 'import_auto_generate_tasks',
  CONFIRM_FINISH: 'import_confirm_finish'
};

// Справочники
const DIRECTORY_STATES = {
  SELECT_CATEGORY: 'dir_select_category',
  LIST_ENTRIES: 'dir_list_entries',
  VIEW_ENTRY: 'dir_view_entry',
  ADD_ENTRY: 'dir_add_entry',
  EDIT_ENTRY: 'dir_edit_entry',
  DELETE_ENTRY: 'dir_delete_entry'
};

// Пользователи
const USER_STATES = {
  LIST: 'user_list',
  VIEW_DETAILS: 'user_view_details',
  ADD: 'user_add',
  EDIT: 'user_edit',
  ASSIGN_ROLE: 'user_assign_role',
  TOGGLE_STATUS: 'user_toggle_status',
  VIEW_LOGS: 'user_view_logs'
};

// Отчеты
const REPORT_STATES = {
  SELECT_TYPE: 'report_select_type',
  FILTER_PERIOD: 'report_filter_period',
  FILTER_MACHINE: 'report_filter_machine',
  FILTER_ITEM: 'report_filter_item',
  EXPORT_FORMAT: 'report_export_format',
  GENERATE_RESULT: 'report_generate_result'
};

// Финансы
const FINANCE_STATES = {
  MENU: 'finance_menu',
  ADD_INCOME: 'finance_add_income',
  ADD_EXPENSE: 'finance_add_expense',
  VIEW_BALANCE: 'finance_view_balance',
  VIEW_HISTORY: 'finance_view_history'
};

// Администрирование
const ADMIN_STATES = {
  MENU: 'admin_menu',
  SETTINGS_SYSTEM: 'settings_system',
  SETTINGS_ROLES: 'settings_roles',
  SETTINGS_USERS: 'settings_users',
  SETTINGS_LOGS: 'settings_logs',
  SETTINGS_NOTIFICATIONS: 'settings_notifications',
  SETTINGS_RESET_DATA: 'settings_reset_data'
};

// Экспорт всех состояний
module.exports = {
  MAIN_MENU_STATES,
  TASK_CREATE_STATES,
  TASK_EXECUTION_STATES,
  CHECKLIST_STATES,
  BAG_STATES,
  WAREHOUSE_RECEIVE_STATES,
  WAREHOUSE_RETURN_STATES,
  WAREHOUSE_INVENTORY_STATES,
  CASH_STATES,
  RETRO_STATES,
  ERROR_STATES,
  IMPORT_STATES,
  DIRECTORY_STATES,
  USER_STATES,
  REPORT_STATES,
  FINANCE_STATES,
  ADMIN_STATES
};
