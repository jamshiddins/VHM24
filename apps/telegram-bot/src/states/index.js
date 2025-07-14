
// ============================================================================
// TELEGRAM BOT FSM STATES
// ============================================================================


const BaseStates = {
  START: 'start',
  MAIN_MENU: 'main_menu',
  UNAUTHORIZED: 'unauthorized'
};


const ManagerStates = {
  ...BaseStates,
  
  // Task Management
  CREATE_TASK: 'manager_create_task',
  SELECT_MACHINE: process.env.API_KEY_0 || 'manager_select_machine',
  SELECT_TASK_TYPE: process.env.API_KEY_1 || 'manager_select_task_type',
  SELECT_INGREDIENTS: process.env.API_KEY_2 || 'manager_select_ingredients',
  CONFIRM_TASK: process.env.API_KEY_3 || 'manager_confirm_task',
  
  // Reports
  VIEW_REPORTS: process.env.API_KEY_4 || 'manager_view_reports',
  SELECT_REPORT: process.env.API_KEY_5 || 'manager_select_report',
  REPORT_FILTERS: process.env.API_KEY_6 || 'manager_report_filters',
  SHOW_REPORT: 'manager_show_report',
  
  // Inventory Management
  MANAGE_INVENTORY: process.env.API_KEY_7 || 'manager_manage_inventory',
  INVENTORY_ACTION: process.env.API_KEY_8 || 'manager_inventory_action',
  
  // Settings
  SETTINGS: 'manager_settings',
  EDIT_SETTING: process.env.API_KEY_9 || 'manager_edit_setting'
};


const WarehouseStates = {
  ...BaseStates,
  
  // Receiving Goods
  RECEIVE_GOODS: process.env.API_KEY_10 || 'warehouse_receive_goods',
  SCAN_ITEM: 'warehouse_scan_item',
  ENTER_WEIGHT: process.env.API_KEY_11 || 'warehouse_enter_weight',
  ENTER_QUANTITY: process.env.API_KEY_12 || 'warehouse_enter_quantity',
  CONFIRM_RECEIPT: process.env.API_KEY_13 || 'warehouse_confirm_receipt',
  
  // Bag Preparation
  PREPARE_BAG: process.env.API_KEY_14 || 'warehouse_prepare_bag',
  SELECT_TASK: process.env.API_KEY_15 || 'warehouse_select_task',
  SELECT_HOPPERS: process.env.API_KEY_16 || 'warehouse_select_hoppers',
  PACK_BAG: 'warehouse_pack_bag',
  PHOTO_BAG: 'warehouse_photo_bag',
  
  // Bag Issue
  ISSUE_BAG: 'warehouse_issue_bag',
  SELECT_BAG: process.env.API_KEY_17 || 'warehouse_select_bag',
  CONFIRM_ISSUE: process.env.API_KEY_18 || 'warehouse_confirm_issue',
  
  // Return Process
  RETURN_PROCESS: process.env.API_KEY_19 || 'warehouse_return_process',
  SCAN_BAG: 'warehouse_scan_bag',
  WEIGH_ITEMS: process.env.API_KEY_20 || 'warehouse_weigh_items',
  PHOTO_RETURN: process.env.API_KEY_21 || 'warehouse_photo_return',
  CONFIRM_RETURN: process.env.API_KEY_22 || 'warehouse_confirm_return',
  
  // Inventory
  INVENTORY_CHECK: process.env.API_KEY_23 || 'warehouse_inventory_check',
  COUNT_ITEMS: process.env.API_KEY_24 || 'warehouse_count_items'
};


const OperatorStates = {
  ...BaseStates,
  
  // Routes
  MY_ROUTES: 'operator_my_routes',
  SELECT_ROUTE: process.env.API_KEY_25 || 'operator_select_route',
  SELECT_MACHINE: process.env.API_KEY_26 || 'operator_select_machine',
  EXECUTE_TASK: process.env.API_KEY_27 || 'operator_execute_task',
  
  // Hopper Replacement
  REPLACE_HOPPERS: process.env.API_KEY_28 || 'operator_replace_hoppers',
  PHOTO_BEFORE: process.env.API_KEY_29 || 'operator_photo_before',
  REMOVE_OLD_HOPPERS: process.env.API_KEY_30 || 'operator_remove_old_hoppers',
  INSTALL_NEW_HOPPERS: process.env.API_KEY_31 || 'operator_install_new_hoppers',
  WEIGH_OLD_HOPPERS: process.env.API_KEY_32 || 'operator_weigh_old_hoppers',
  PHOTO_AFTER: process.env.API_KEY_33 || 'operator_photo_after',
  
  // Water Replacement
  REPLACE_WATER: process.env.API_KEY_34 || 'operator_replace_water',
  SELECT_BOTTLES: process.env.API_KEY_35 || 'operator_select_bottles',
  INSTALL_WATER: process.env.API_KEY_36 || 'operator_install_water',
  RETURN_OLD_WATER: process.env.API_KEY_37 || 'operator_return_old_water',
  WEIGH_WATER: process.env.API_KEY_38 || 'operator_weigh_water',
  
  // Cleaning
  CLEANING: 'operator_cleaning',
  CLEANING_CHECKLIST: process.env.API_KEY_39 || 'operator_cleaning_checklist',
  CLEANING_PHOTO_BEFORE: process.env.API_KEY_40 || 'operator_cleaning_photo_before',
  CLEANING_PROCESS: process.env.API_KEY_41 || 'operator_cleaning_process',
  CLEANING_PHOTO_AFTER: process.env.API_KEY_42 || 'operator_cleaning_photo_after',
  TEST_PURCHASE: process.env.API_KEY_43 || 'operator_test_purchase',
  
  // Cash Collection
  CASH_COLLECTION: process.env.API_KEY_44 || 'operator_cash_collection',
  COUNT_CASH: 'operator_count_cash',
  PHOTO_CASH: 'operator_photo_cash',
  SUBMIT_CASH: process.env.API_KEY_45 || 'operator_submit_cash'
};


const TechnicianStates = {
  ...BaseStates,
  
  // Repair Tasks
  REPAIR_TASKS: process.env.API_KEY_46 || 'technician_repair_tasks',
  SELECT_REPAIR: process.env.API_KEY_47 || 'technician_select_repair',
  DIAGNOSE_PROBLEM: process.env.API_KEY_48 || 'technician_diagnose_problem',
  PHOTO_PROBLEM: process.env.API_KEY_49 || 'technician_photo_problem',
  REPAIR_PROCESS: process.env.API_KEY_50 || 'technician_repair_process',
  PHOTO_REPAIR: process.env.API_KEY_51 || 'technician_photo_repair',
  TEST_MACHINE: process.env.API_KEY_52 || 'technician_test_machine',
  COMPLETE_REPAIR: process.env.API_KEY_53 || 'technician_complete_repair'
};


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
  SYSTEM_SETTINGS: process.env.API_KEY_54 || 'admin_system_settings',
  VIEW_LOGS: 'admin_view_logs',
  BACKUP_DATA: 'admin_backup_data'
};


const StatesByRole = {
  ADMIN: AdminStates,
  MANAGER: ManagerStates,
  WAREHOUSE: WarehouseStates,
  OPERATOR: OperatorStates,
  TECHNICIAN: TechnicianStates
};
