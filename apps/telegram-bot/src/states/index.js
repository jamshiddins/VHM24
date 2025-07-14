
// ============================================================================
// TELEGRAM BOT FSM STATES
// ============================================================================

/**
 * Base States
 */
const BaseStates = {
  START: 'start',
  MAIN_MENU: 'main_menu',
  UNAUTHORIZED: 'unauthorized'
};

/**
 * Manager States
 */
const ManagerStates = {
  ...BaseStates,
  
  // Task Management
  CREATE_TASK: 'manager_create_task',
  SELECT_MACHINE: 'manager_select_machine',
  SELECT_TASK_TYPE: 'manager_select_task_type',
  SELECT_INGREDIENTS: 'manager_select_ingredients',
  CONFIRM_TASK: 'manager_confirm_task',
  
  // Reports
  VIEW_REPORTS: 'manager_view_reports',
  SELECT_REPORT: 'manager_select_report',
  REPORT_FILTERS: 'manager_report_filters',
  SHOW_REPORT: 'manager_show_report',
  
  // Inventory Management
  MANAGE_INVENTORY: 'manager_manage_inventory',
  INVENTORY_ACTION: 'manager_inventory_action',
  
  // Settings
  SETTINGS: 'manager_settings',
  EDIT_SETTING: 'manager_edit_setting'
};

/**
 * Warehouse States
 */
const WarehouseStates = {
  ...BaseStates,
  
  // Receiving Goods
  RECEIVE_GOODS: 'warehouse_receive_goods',
  SCAN_ITEM: 'warehouse_scan_item',
  ENTER_WEIGHT: 'warehouse_enter_weight',
  ENTER_QUANTITY: 'warehouse_enter_quantity',
  CONFIRM_RECEIPT: 'warehouse_confirm_receipt',
  
  // Bag Preparation
  PREPARE_BAG: 'warehouse_prepare_bag',
  SELECT_TASK: 'warehouse_select_task',
  SELECT_HOPPERS: 'warehouse_select_hoppers',
  PACK_BAG: 'warehouse_pack_bag',
  PHOTO_BAG: 'warehouse_photo_bag',
  
  // Bag Issue
  ISSUE_BAG: 'warehouse_issue_bag',
  SELECT_BAG: 'warehouse_select_bag',
  CONFIRM_ISSUE: 'warehouse_confirm_issue',
  
  // Return Process
  RETURN_PROCESS: 'warehouse_return_process',
  SCAN_BAG: 'warehouse_scan_bag',
  WEIGH_ITEMS: 'warehouse_weigh_items',
  PHOTO_RETURN: 'warehouse_photo_return',
  CONFIRM_RETURN: 'warehouse_confirm_return',
  
  // Inventory
  INVENTORY_CHECK: 'warehouse_inventory_check',
  COUNT_ITEMS: 'warehouse_count_items'
};

/**
 * Operator States
 */
const OperatorStates = {
  ...BaseStates,
  
  // Routes
  MY_ROUTES: 'operator_my_routes',
  SELECT_ROUTE: 'operator_select_route',
  SELECT_MACHINE: 'operator_select_machine',
  EXECUTE_TASK: 'operator_execute_task',
  
  // Hopper Replacement
  REPLACE_HOPPERS: 'operator_replace_hoppers',
  PHOTO_BEFORE: 'operator_photo_before',
  REMOVE_OLD_HOPPERS: 'operator_remove_old_hoppers',
  INSTALL_NEW_HOPPERS: 'operator_install_new_hoppers',
  WEIGH_OLD_HOPPERS: 'operator_weigh_old_hoppers',
  PHOTO_AFTER: 'operator_photo_after',
  
  // Water Replacement
  REPLACE_WATER: 'operator_replace_water',
  SELECT_BOTTLES: 'operator_select_bottles',
  INSTALL_WATER: 'operator_install_water',
  RETURN_OLD_WATER: 'operator_return_old_water',
  WEIGH_WATER: 'operator_weigh_water',
  
  // Cleaning
  CLEANING: 'operator_cleaning',
  CLEANING_CHECKLIST: 'operator_cleaning_checklist',
  CLEANING_PHOTO_BEFORE: 'operator_cleaning_photo_before',
  CLEANING_PROCESS: 'operator_cleaning_process',
  CLEANING_PHOTO_AFTER: 'operator_cleaning_photo_after',
  TEST_PURCHASE: 'operator_test_purchase',
  
  // Cash Collection
  CASH_COLLECTION: 'operator_cash_collection',
  COUNT_CASH: 'operator_count_cash',
  PHOTO_CASH: 'operator_photo_cash',
  SUBMIT_CASH: 'operator_submit_cash'
};

/**
 * Technician States
 */
const TechnicianStates = {
  ...BaseStates,
  
  // Repair Tasks
  REPAIR_TASKS: 'technician_repair_tasks',
  SELECT_REPAIR: 'technician_select_repair',
  DIAGNOSE_PROBLEM: 'technician_diagnose_problem',
  PHOTO_PROBLEM: 'technician_photo_problem',
  REPAIR_PROCESS: 'technician_repair_process',
  PHOTO_REPAIR: 'technician_photo_repair',
  TEST_MACHINE: 'technician_test_machine',
  COMPLETE_REPAIR: 'technician_complete_repair'
};

/**
 * Admin States
 */
const AdminStates = {
  ...BaseStates,
  ...ManagerStates,
  ...WarehouseStates,
  ...OperatorStates,
  ...TechnicianStates,
  
  // User Management
  MANAGE_USERS: 'admin_manage_users',
  CREATE_USER: 'admin_create_user',
  EDIT_USER: 'admin_edit_user',
  DELETE_USER: 'admin_delete_user',
  
  // System Management
  SYSTEM_SETTINGS: 'admin_system_settings',
  VIEW_LOGS: 'admin_view_logs',
  BACKUP_DATA: 'admin_backup_data'
};

/**
 * State Groups by Role
 */
const StatesByRole = {
  ADMIN: AdminStates,
  MANAGER: ManagerStates,
  WAREHOUSE: WarehouseStates,
  OPERATOR: OperatorStates,
  TECHNICIAN: TechnicianStates
};
