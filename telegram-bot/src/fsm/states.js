const BOT_STATES = {
  "IDLE": 'idle',
  "MAIN_MENU": 'main_menu',
  "OPERATOR_MENU": 'operator_menu',
  "WAREHOUSE_MENU": 'warehouse_menu',
  "MANAGER_MENU": 'manager_menu',
  "TECHNICIAN_MENU": 'technician_menu',
  
  // Состояния для оператора
  "OPERATOR_TASKS": 'operator_tasks',
  "OPERATOR_TASK_EXECUTION": 'operator_task_execution',
  "OPERATOR_CHECKLIST": 'operator_checklist',
  "OPERATOR_BAG_RETURN": 'operator_bag_return',
  "OPERATOR_INCASSATION": 'operator_incassation',
  "OPERATOR_REPORT": 'operator_report',
  
  // Состояния для склада
  "WAREHOUSE_BAGS": 'warehouse_bags',
  "WAREHOUSE_INVENTORY": 'warehouse_inventory',
  "WAREHOUSE_RECEIVE": 'warehouse_receive',
  "WAREHOUSE_WASH": 'warehouse_wash',
  
  // Состояния для менеджера
  "MANAGER_CREATE_TASK": 'manager_create_task',
  "MANAGER_ASSIGN_TASK": 'manager_assign_task',
  "MANAGER_ANALYTICS": 'manager_analytics',
  "MANAGER_REPORTS": 'manager_reports',
  "MANAGER_ALERTS": 'manager_alerts',
  "MANAGER_ROUTES": 'manager_routes',
  
  // Состояния для техника
  "TECHNICIAN_REPAIR": 'technician_repair',
  "TECHNICIAN_MAINTENANCE": 'technician_maintenance',
  "TECHNICIAN_DIAGNOSTICS": 'technician_diagnostics',
  
  // Общие состояния
  "SETTINGS": 'settings',
  "PROFILE": 'profile',
  "HELP": 'help',
  "ERROR": 'error'
};

module.exports = { BOT_STATES };
