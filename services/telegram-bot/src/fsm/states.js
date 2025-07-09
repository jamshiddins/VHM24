/**
 * VHM24 Telegram Bot FSM States
 * Состояния для полного процесса регистрации и работы
 */

// Состояния регистрации
const REGISTRATION_STATES = {
  WAITING_PHONE: 'registration:waiting_phone',
  WAITING_PASSWORD: 'registration:waiting_password',
  WAITING_ADMIN_APPROVAL: 'registration:waiting_admin_approval',
  COMPLETED: 'registration:completed'
};

// Состояния для водителей
const DRIVER_STATES = {
  WAITING_ROUTE_START: 'driver:waiting_route_start',
  WAITING_MILEAGE: 'driver:waiting_mileage',
  WAITING_FUEL_PHOTO: 'driver:waiting_fuel_photo',
  WAITING_ARRIVAL_CONFIRMATION: 'driver:waiting_arrival_confirmation',
  WAITING_GPS_LOCATION: 'driver:waiting_gps_location'
};

// Состояния для задач
const TASK_STATES = {
  WAITING_TASK_PHOTO_BEFORE: 'task:waiting_photo_before',
  WAITING_TASK_PHOTO_AFTER: 'task:waiting_photo_after',
  WAITING_TASK_COMMENT: 'task:waiting_comment',
  WAITING_TASK_COMPLETION: 'task:waiting_completion'
};

// Состояния для склада
const WAREHOUSE_STATES = {
  WAITING_ITEM_SCAN: 'warehouse:waiting_item_scan',
  WAITING_QUANTITY_INPUT: 'warehouse:waiting_quantity_input',
  WAITING_BUNKER_PHOTO: 'warehouse:waiting_bunker_photo',
  WAITING_WEIGHT_INPUT: 'warehouse:waiting_weight_input'
};

// Состояния для операторов
const OPERATOR_STATES = {
  WAITING_MACHINE_SELECTION: 'operator:waiting_machine_selection',
  WAITING_BUNKER_INSTALLATION: 'operator:waiting_bunker_installation',
  WAITING_REMAINS_INPUT: 'operator:waiting_remains_input',
  WAITING_PROBLEM_DESCRIPTION: 'operator:waiting_problem_description'
};

// Состояния для техников
const TECHNICIAN_STATES = {
  TECHNICIAN_MENU: 'technician:menu',
  TECHNICIAN_SELECT_MACHINE: 'technician:select_machine',
  TECHNICIAN_MAINTENANCE: 'technician:maintenance',
  TECHNICIAN_CHECKLIST: 'technician:checklist',
  TECHNICIAN_PART_REPLACEMENT: 'technician:part_replacement',
  TECHNICIAN_REPORT_PROBLEM: 'technician:report_problem',
  WAITING_CHECKLIST_ITEM: 'technician:waiting_checklist_item',
  WAITING_PART_REPLACEMENT: 'technician:waiting_part_replacement',
  WAITING_SERVICE_PHOTO: 'technician:waiting_service_photo',
  WAITING_SERVICE_REPORT: 'technician:waiting_service_report'
};

// Состояния для отчетов
const REPORT_STATES = {
  WAITING_REPORT_TYPE: 'report:waiting_type',
  WAITING_DATE_RANGE: 'report:waiting_date_range',
  WAITING_MACHINE_FILTER: 'report:waiting_machine_filter'
};

// Общие состояния
const COMMON_STATES = {
  IDLE: 'common:idle',
  WAITING_CONFIRMATION: 'common:waiting_confirmation',
  WAITING_ADMIN_ACTION: 'common:waiting_admin_action'
};

// Все состояния
const ALL_STATES = {
  ...REGISTRATION_STATES,
  ...DRIVER_STATES,
  ...TASK_STATES,
  ...WAREHOUSE_STATES,
  ...OPERATOR_STATES,
  ...TECHNICIAN_STATES,
  ...REPORT_STATES,
  ...COMMON_STATES
};

// Функции для проверки состояний
const isRegistrationState = (state) => {
  return Object.values(REGISTRATION_STATES).includes(state);
};

const isDriverState = (state) => {
  return Object.values(DRIVER_STATES).includes(state);
};

const isTaskState = (state) => {
  return Object.values(TASK_STATES).includes(state);
};

const isWarehouseState = (state) => {
  return Object.values(WAREHOUSE_STATES).includes(state);
};

const isOperatorState = (state) => {
  return Object.values(OPERATOR_STATES).includes(state);
};

const isTechnicianState = (state) => {
  return Object.values(TECHNICIAN_STATES).includes(state);
};

const isReportState = (state) => {
  return Object.values(REPORT_STATES).includes(state);
};

module.exports = {
  REGISTRATION_STATES,
  DRIVER_STATES,
  TASK_STATES,
  WAREHOUSE_STATES,
  OPERATOR_STATES,
  TECHNICIAN_STATES,
  REPORT_STATES,
  COMMON_STATES,
  ALL_STATES,
  isRegistrationState,
  isDriverState,
  isTaskState,
  isWarehouseState,
  isOperatorState,
  isTechnicianState,
  isReportState
};
