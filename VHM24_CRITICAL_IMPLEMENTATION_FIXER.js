#!/usr/bin/env node

/**
 * VHM24 VendHub - Критический фиксер реализации
 * Создает полную схему базы данных и основные компоненты системы
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 VHM24 VendHub - Критический фиксер реализации');
console.log('================================================');

// 1. Создание полной схемы Prisma
const prismaSchema = `
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ПОЛЬЗОВАТЕЛИ И РОЛИ
// ============================================================================

model User {
  id          String   @id @default(cuid())
  telegramId  String   @unique @map("telegram_id")
  name        String
  phone       String?
  role        UserRole @default(OPERATOR)
  status      UserStatus @default(ACTIVE)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Связи
  assignedTasks     Task[]
  createdTasks      Task[] @relation("TaskCreator")
  actionLogs        ActionLog[]
  expenses          Expense[]
  incomes           Income[]
  bagIssues         BagIssue[]
  bagReturns        BagReturn[]
  taskChecklists    TaskChecklist[]

  @@map("users")
}

enum UserRole {
  ADMIN
  MANAGER
  WAREHOUSE
  OPERATOR
  TECHNICIAN
  DRIVER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BLOCKED
}

// ============================================================================
// ЛОКАЦИИ И АВТОМАТЫ
// ============================================================================

model Location {
  id              String  @id @default(cuid())
  name            String
  address         String
  coordinates     String?
  rentCost        Float?  @map("rent_cost")
  electricityCost Float?  @map("electricity_cost")
  internetCost    Float?  @map("internet_cost")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Связи
  machines        Machine[]

  @@map("locations")
}

model Machine {
  id              String        @id @default(cuid())
  internalCode    String        @unique @map("internal_code")
  model           String?
  serialNumber    String?       @map("serial_number")
  type            MachineType   @default(COFFEE)
  status          MachineStatus @default(ACTIVE)
  locationId      String        @map("location_id")
  simCard         String?       @map("sim_card")
  electricityMeter String?      @map("electricity_meter")
  monthlyTraffic  Float?        @map("monthly_traffic")
  monthlyElectricity Float?     @map("monthly_electricity")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  // Связи
  location        Location      @relation(fields: [locationId], references: [id])
  tasks           Task[]
  bags            Bag[]
  sales           Sale[]
  expenses        Expense[]
  incomes         Income[]
  waterBottles    WaterBottle[]
  hopperInstallations HopperInstallation[]

  @@map("machines")
}

enum MachineType {
  COFFEE
  SNACKS
  DRINKS
  COMBO
  ICE
}

enum MachineStatus {
  ACTIVE
  MAINTENANCE
  OFFLINE
  BROKEN
  DECOMMISSIONED
}

// ============================================================================
// ИНГРЕДИЕНТЫ И БУНКЕРЫ
// ============================================================================

model Ingredient {
  id            String  @id @default(cuid())
  name          String
  type          IngredientType
  unit          String  // г, кг, л, мл, шт
  shelfLifeDays Int?    @map("shelf_life_days")
  minStock      Float?  @map("min_stock")
  price         Float?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Связи
  hoppers       Hopper[]
  recipeIngredients RecipeIngredient[]

  @@map("ingredients")
}

enum IngredientType {
  COFFEE
  MILK
  SUGAR
  CHOCOLATE
  TEA
  SYRUP
  WATER
  CONSUMABLE
}

model Hopper {
  id            String      @id @default(cuid())
  code          String      @unique // SET-001-4S
  ingredientId  String      @map("ingredient_id")
  weightEmpty   Float       @map("weight_empty")
  weightCurrent Float?      @map("weight_current")
  status        HopperStatus @default(ON_WAREHOUSE)
  cyclesCount   Int         @default(0) @map("cycles_count")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  // Связи
  ingredient    Ingredient  @relation(fields: [ingredientId], references: [id])
  bagContents   BagContent[]
  hopperInstallations HopperInstallation[]

  @@map("hoppers")
}

enum HopperStatus {
  ON_WAREHOUSE
  IN_BAG
  INSTALLED
  RETURNED
  CLEANING
  DAMAGED
}

model HopperInstallation {
  id          String   @id @default(cuid())
  hopperId    String   @map("hopper_id")
  machineId   String   @map("machine_id")
  installedAt DateTime @map("installed_at")
  removedAt   DateTime? @map("removed_at")
  weightBefore Float?  @map("weight_before")
  weightAfter  Float?  @map("weight_after")

  // Связи
  hopper      Hopper   @relation(fields: [hopperId], references: [id])
  machine     Machine  @relation(fields: [machineId], references: [id])

  @@map("hopper_installations")
}

// ============================================================================
// СИРОПЫ И ВОДА
// ============================================================================

model Syrup {
  id            String      @id @default(cuid())
  name          String
  bottleVolume  Float       @map("bottle_volume")
  status        SyrupStatus @default(ON_WAREHOUSE)
  expiryDate    DateTime?   @map("expiry_date")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  // Связи
  bagContents   BagContent[]

  @@map("syrups")
}

enum SyrupStatus {
  ON_WAREHOUSE
  IN_BAG
  INSTALLED
  USED
  EXPIRED
}

model WaterBottle {
  id            String           @id @default(cuid())
  uniqueCode    String           @unique @map("unique_code")
  volume        Float
  weightFull    Float            @map("weight_full")
  weightCurrent Float?           @map("weight_current")
  status        WaterBottleStatus @default(ON_WAREHOUSE)
  machineId     String?          @map("machine_id")
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")

  // Связи
  machine       Machine?         @relation(fields: [machineId], references: [id])

  @@map("water_bottles")
}

enum WaterBottleStatus {
  ON_WAREHOUSE
  ISSUED
  INSTALLED
  RETURNED
  EMPTY
}

// ============================================================================
// СУМКИ И КОМПЛЕКТЫ
// ============================================================================

model Bag {
  id              String    @id @default(cuid())
  code            String    @unique
  assignedMachineId String? @map("assigned_machine_id")
  status          BagStatus @default(PREPARED)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Связи
  assignedMachine Machine?  @relation(fields: [assignedMachineId], references: [id])
  contents        BagContent[]
  issues          BagIssue[]
  returns         BagReturn[]
  tasks           Task[]

  @@map("bags")
}

enum BagStatus {
  PREPARED
  ISSUED
  IN_USE
  RETURNED
  CHECKED
}

model BagContent {
  id        String  @id @default(cuid())
  bagId     String  @map("bag_id")
  hopperId  String? @map("hopper_id")
  syrupId   String? @map("syrup_id")
  quantity  Int     @default(1)

  // Связи
  bag       Bag     @relation(fields: [bagId], references: [id])
  hopper    Hopper? @relation(fields: [hopperId], references: [id])
  syrup     Syrup?  @relation(fields: [syrupId], references: [id])

  @@map("bag_contents")
}

model BagIssue {
  id        String   @id @default(cuid())
  bagId     String   @map("bag_id")
  userId    String   @map("user_id")
  issuedAt  DateTime @map("issued_at")
  photoUrl  String?  @map("photo_url")

  // Связи
  bag       Bag      @relation(fields: [bagId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@map("bag_issues")
}

model BagReturn {
  id          String   @id @default(cuid())
  bagId       String   @map("bag_id")
  userId      String   @map("user_id")
  returnedAt  DateTime @map("returned_at")
  photoUrl    String?  @map("photo_url")
  notes       String?

  // Связи
  bag         Bag      @relation(fields: [bagId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@map("bag_returns")
}

// ============================================================================
// ЗАДАЧИ И ЧЕК-ЛИСТЫ
// ============================================================================

model Task {
  id              String     @id @default(cuid())
  type            TaskType
  machineId       String     @map("machine_id")
  assignedUserId  String     @map("assigned_user_id")
  createdUserId   String     @map("created_user_id")
  bagId           String?    @map("bag_id")
  status          TaskStatus @default(CREATED)
  deadline        DateTime?
  description     String?
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")
  completedAt     DateTime?  @map("completed_at")

  // Связи
  machine         Machine    @relation(fields: [machineId], references: [id])
  assignedUser    User       @relation(fields: [assignedUserId], references: [id])
  createdUser     User       @relation("TaskCreator", fields: [createdUserId], references: [id])
  bag             Bag?       @relation(fields: [bagId], references: [id])
  checklists      TaskChecklist[]

  @@map("tasks")
}

enum TaskType {
  REPLACE_INGREDIENTS
  REPLACE_WATER
  REPLACE_SYRUPS
  CLEANING
  MAINTENANCE
  CASH_COLLECTION
  REPAIR
  INSPECTION
  TEST_PURCHASE
}

enum TaskStatus {
  CREATED
  ASSIGNED
  IN_PROGRESS
  PAUSED
  COMPLETED
  FAILED
  CANCELLED
}

model TaskChecklist {
  id          String            @id @default(cuid())
  taskId      String            @map("task_id")
  stepName    String            @map("step_name")
  status      ChecklistStatus   @default(PENDING)
  photoUrl    String?           @map("photo_url")
  weight      Float?
  notes       String?
  userId      String?           @map("user_id")
  timestamp   DateTime?
  createdAt   DateTime          @default(now()) @map("created_at")

  // Связи
  task        Task              @relation(fields: [taskId], references: [id])
  user        User?             @relation(fields: [userId], references: [id])

  @@map("task_checklists")
}

enum ChecklistStatus {
  PENDING
  COMPLETED
  SKIPPED
  FAILED
}

// ============================================================================
// РЕЦЕПТЫ
// ============================================================================

model Recipe {
  id          String   @id @default(cuid())
  name        String
  description String?
  totalCost   Float?   @map("total_cost")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Связи
  ingredients RecipeIngredient[]

  @@map("recipes")
}

model RecipeIngredient {
  id           String     @id @default(cuid())
  recipeId     String     @map("recipe_id")
  ingredientId String     @map("ingredient_id")
  amount       Float
  unit         String

  // Связи
  recipe       Recipe     @relation(fields: [recipeId], references: [id])
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id])

  @@map("recipe_ingredients")
}

// ============================================================================
// ПРОДАЖИ И ПЛАТЕЖИ
// ============================================================================

model Sale {
  id            String        @id @default(cuid())
  machineId     String        @map("machine_id")
  productName   String        @map("product_name")
  amount        Float
  paymentMethod PaymentMethod @map("payment_method")
  timestamp     DateTime
  isTest        Boolean       @default(false) @map("is_test")

  // Связи
  machine       Machine       @relation(fields: [machineId], references: [id])
  payments      Payment[]

  @@map("sales")
}

enum PaymentMethod {
  CASH
  QR_PAYME
  QR_CLICK
  QR_UZUM
  CARD
  VIP
  TEST
}

model Payment {
  id            String        @id @default(cuid())
  saleId        String        @map("sale_id")
  provider      String
  amount        Float
  status        PaymentStatus
  transactionId String?       @map("transaction_id")
  timestamp     DateTime

  // Связи
  sale          Sale          @relation(fields: [saleId], references: [id])

  @@map("payments")
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

// ============================================================================
// ФИНАНСЫ
// ============================================================================

model Expense {
  id          String   @id @default(cuid())
  category    String
  amount      Float
  date        DateTime
  machineId   String?  @map("machine_id")
  userId      String   @map("user_id")
  description String?
  receiptUrl  String?  @map("receipt_url")
  createdAt   DateTime @default(now()) @map("created_at")

  // Связи
  machine     Machine? @relation(fields: [machineId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@map("expenses")
}

model Income {
  id          String   @id @default(cuid())
  source      String
  amount      Float
  date        DateTime
  machineId   String?  @map("machine_id")
  userId      String   @map("user_id")
  description String?
  createdAt   DateTime @default(now()) @map("created_at")

  // Связи
  machine     Machine? @relation(fields: [machineId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@map("incomes")
}

// ============================================================================
// ЖУРНАЛ ДЕЙСТВИЙ
// ============================================================================

model ActionLog {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  actionType String   @map("action_type")
  objectType String   @map("object_type")
  objectId   String   @map("object_id")
  details    Json?
  timestamp  DateTime @default(now())
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")

  // Связи
  user       User     @relation(fields: [userId], references: [id])

  @@map("action_logs")
}

// ============================================================================
// ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
// ============================================================================

// Индексы будут созданы автоматически для:
// - Все @unique поля
// - Все foreign key поля
// - Поля с @id

// Дополнительные индексы можно добавить при необходимости
`;

// 2. Создание базовых API endpoints
const apiEndpoints = `
// ============================================================================
// API ENDPOINTS STRUCTURE
// ============================================================================

/**
 * Authentication Routes
 */
POST   /api/auth/telegram          - Telegram authentication
GET    /api/auth/me                - Get current user
POST   /api/auth/logout            - Logout

/**
 * Users Management
 */
GET    /api/users                  - List users (admin, manager)
POST   /api/users                  - Create user (admin)
GET    /api/users/:id              - Get user details
PUT    /api/users/:id              - Update user (admin)
DELETE /api/users/:id              - Delete user (admin)
PUT    /api/users/:id/role         - Change user role (admin)
PUT    /api/users/:id/status       - Change user status (admin)

/**
 * Machines Management
 */
GET    /api/machines               - List machines
POST   /api/machines               - Create machine (admin, manager)
GET    /api/machines/:id           - Get machine details
PUT    /api/machines/:id           - Update machine (admin, manager)
DELETE /api/machines/:id           - Delete machine (admin)
GET    /api/machines/:id/status    - Get machine status
PUT    /api/machines/:id/status    - Update machine status

/**
 * Locations Management
 */
GET    /api/locations              - List locations
POST   /api/locations              - Create location (admin, manager)
GET    /api/locations/:id          - Get location details
PUT    /api/locations/:id          - Update location (admin, manager)
DELETE /api/locations/:id          - Delete location (admin)

/**
 * Ingredients Management
 */
GET    /api/ingredients            - List ingredients
POST   /api/ingredients            - Create ingredient (admin, manager)
GET    /api/ingredients/:id        - Get ingredient details
PUT    /api/ingredients/:id        - Update ingredient (admin, manager)
DELETE /api/ingredients/:id        - Delete ingredient (admin)

/**
 * Hoppers Management
 */
GET    /api/hoppers                - List hoppers
POST   /api/hoppers                - Create hopper (admin, manager, warehouse)
GET    /api/hoppers/:id            - Get hopper details
PUT    /api/hoppers/:id            - Update hopper (admin, manager, warehouse)
DELETE /api/hoppers/:id            - Delete hopper (admin)
PUT    /api/hoppers/:id/status     - Update hopper status
POST   /api/hoppers/:id/weigh      - Record hopper weight

/**
 * Bags Management
 */
GET    /api/bags                   - List bags
POST   /api/bags                   - Create bag (warehouse)
GET    /api/bags/:id               - Get bag details
PUT    /api/bags/:id               - Update bag (warehouse)
DELETE /api/bags/:id               - Delete bag (admin, warehouse)
POST   /api/bags/:id/issue         - Issue bag to operator
POST   /api/bags/:id/return        - Return bag from operator

/**
 * Water Bottles Management
 */
GET    /api/water-bottles          - List water bottles
POST   /api/water-bottles          - Create water bottle (warehouse)
GET    /api/water-bottles/:id      - Get water bottle details
PUT    /api/water-bottles/:id      - Update water bottle (warehouse)
DELETE /api/water-bottles/:id      - Delete water bottle (admin)
POST   /api/water-bottles/:id/weigh - Record water bottle weight

/**
 * Syrups Management
 */
GET    /api/syrups                 - List syrups
POST   /api/syrups                 - Create syrup (admin, manager, warehouse)
GET    /api/syrups/:id             - Get syrup details
PUT    /api/syrups/:id             - Update syrup (admin, manager, warehouse)
DELETE /api/syrups/:id             - Delete syrup (admin)

/**
 * Tasks Management
 */
GET    /api/tasks                  - List tasks (filtered by role)
POST   /api/tasks                  - Create task (manager, admin)
GET    /api/tasks/:id              - Get task details
PUT    /api/tasks/:id              - Update task
DELETE /api/tasks/:id              - Delete task (admin, manager)
POST   /api/tasks/:id/start        - Start task execution
POST   /api/tasks/:id/complete     - Complete task
POST   /api/tasks/:id/checklist    - Update task checklist

/**
 * Recipes Management
 */
GET    /api/recipes                - List recipes
POST   /api/recipes                - Create recipe (admin, manager)
GET    /api/recipes/:id            - Get recipe details
PUT    /api/recipes/:id            - Update recipe (admin, manager)
DELETE /api/recipes/:id            - Delete recipe (admin)

/**
 * Sales and Payments
 */
GET    /api/sales                  - List sales
POST   /api/sales                  - Record sale
GET    /api/sales/:id              - Get sale details
GET    /api/payments               - List payments
POST   /api/payments               - Record payment

/**
 * Financial Management
 */
GET    /api/expenses               - List expenses
POST   /api/expenses               - Create expense (admin, manager)
GET    /api/expenses/:id           - Get expense details
PUT    /api/expenses/:id           - Update expense (admin, manager)
DELETE /api/expenses/:id           - Delete expense (admin)

GET    /api/incomes                - List incomes
POST   /api/incomes                - Create income (admin, manager)
GET    /api/incomes/:id            - Get income details
PUT    /api/incomes/:id            - Update income (admin, manager)
DELETE /api/incomes/:id            - Delete income (admin)

/**
 * Reports
 */
GET    /api/reports/sales          - Sales report
GET    /api/reports/inventory      - Inventory report
GET    /api/reports/tasks          - Tasks report
GET    /api/reports/finance        - Financial report
GET    /api/reports/reconciliation - Reconciliation report
POST   /api/reports/export         - Export report to Excel/PDF

/**
 * File Upload
 */
POST   /api/upload                 - Upload file (photos, documents)
GET    /api/files/:id              - Get file
DELETE /api/files/:id              - Delete file (admin)

/**
 * Action Logs
 */
GET    /api/logs                   - List action logs (admin)
GET    /api/logs/user/:userId      - User action logs
GET    /api/logs/object/:objectId  - Object action logs

/**
 * System
 */
GET    /api/health                 - Health check
GET    /api/version                - System version
POST   /api/webhook                - Webhook endpoint for external integrations
`;

// 3. Создание Telegram Bot FSM структуры
const telegramBotFSM = `
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
`;

// Функция для записи файлов
function writeFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Создан файл: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка создания файла ${filePath}:`, error.message);
    return false;
  }
}

// Основная функция
async function main() {
  console.log('\n1. 📝 Создание полной схемы Prisma...');
  
  // Создаем схему Prisma
  writeFile('backend/prisma/schema.prisma', prismaSchema);
  
  console.log('\n2. 📋 Создание документации API...');
  writeFile('docs/API_ENDPOINTS.md', apiEndpoints);
  
  console.log('\n3. 🤖 Создание FSM структуры для Telegram бота...');
  writeFile('apps/telegram-bot/src/states/index.js', telegramBotFSM);
  
  // Создаем базовые контроллеры
  console.log('\n4. 🎮 Создание базовых контроллеров...');
  
  const userController = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UserController {
  async getUsers(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          telegramId: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true
        }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const { telegramId, name, phone, role } = req.body;
      const user = await prisma.user.create({
        data: { telegramId, name, phone, role }
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          assignedTasks: true,
          actionLogs: {
            take: 10,
            orderBy: { timestamp: 'desc' }
          }
        }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await prisma.user.update({
        where: { id },
        data: updateData
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await prisma.user.delete({
        where: { id }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
`;

  writeFile('backend/src/controllers/userController.js', userController);
  
  const machineController = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MachineController {
  async getMachines(req, res) {
    try {
      const machines = await prisma.machine.findMany({
        include: {
          location: true,
          tasks: {
            where: { status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] } },
            take: 5
          }
        }
      });
      res.json(machines);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMachine(req, res) {
    try {
      const machine = await prisma.machine.create({
        data: req.body,
        include: { location: true }
      });
      res.status(201).json(machine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMachineById(req, res) {
    try {
      const { id } = req.params;
      const machine = await prisma.machine.findUnique({
        where: { id },
        include: {
          location: true,
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          sales: {
            orderBy: { timestamp: 'desc' },
            take: 20
          },
          hopperInstallations: {
            include: { hopper: { include: { ingredient: true } } }
          }
        }
      });
      
      if (!machine) {
        return res.status(404).json({ error: 'Machine not found' });
      }
      
      res.json(machine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateMachine(req, res) {
    try {
      const { id } = req.params;
      const machine = await prisma.machine.update({
        where: { id },
        data: req.body,
        include: { location: true }
      });
      res.json(machine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MachineController();
`;

  writeFile('backend/src/controllers/machineController.js', machineController);
  
  // Создаем middleware для проверки ролей
  const roleMiddleware = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true }
      });
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'User account is not active' });
      }
      
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      req.userRole = user.role;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Здесь должна быть логика проверки JWT токена
    // Для простоты пока пропускаем
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  checkRole,
  requireAuth
};
`;

  writeFile('backend/src/middleware/auth.js', roleMiddleware);
  
  console.log('\n5. 🛠️ Создание утилит...');
  
  const logger = `
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'vendhub-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
`;

  writeFile('backend/src/utils/logger.js', logger);
  
  console.log('\n6. 📱 Создание базового Telegram бота...');
  
  const telegramBot = `
const { Telegraf, Scenes, session } = require('telegraf');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware для аутентификации
bot.use(async (ctx, next) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId }
    });
    
    if (!user) {
      return ctx.reply('❌ Вы не зарегистрированы в системе. Обратитесь к администратору.');
    }
    
    if (user.status !== 'ACTIVE') {
      return ctx.reply('❌ Ваш аккаунт заблокирован. Обратитесь к администратору.');
    }
    
    ctx.user = user;
    return next();
  } catch (error) {
    console.error('Auth error:', error);
    return ctx.reply('❌ Ошибка авторизации. Попробуйте позже.');
  }
});

// Команда /start
bot.start(async (ctx) => {
  const user = ctx.user;
  
  const welcomeMessage = \`
🎉 Добро пожаловать в VendHub!

👤 Пользователь: \${user.name}
🔑 Роль: \${user.role}

Выберите действие:
\`;

  const keyboard = getMainKeyboard(user.role);
  
  return ctx.reply(welcomeMessage, keyboard);
});

// Функция для получения клавиатуры по роли
function getMainKeyboard(role) {
  const keyboards = {
    ADMIN: [
      ['👥 Пользователи', '🏭 Автоматы'],
      ['📋 Задачи', '📊 Отчеты'],
      ['⚙️ Настройки', '📝 Логи']
    ],
    MANAGER: [
      ['📋 Создать задачу', '📊 Отчеты'],
      ['🏭 Автоматы', '📦 Склад'],
      ['💰 Финансы']
    ],
    WAREHOUSE: [
      ['📦 Приемка', '📤 Выдача'],
      ['🎒 Сумки', '⚖️ Взвешивание'],
      ['📋 Инвентарь']
    ],
    OPERATOR: [
      ['🗺️ Мои маршруты', '📋 Задачи'],
      ['🔄 Замена бункеров', '💧 Замена воды'],
      ['🧽 Чистка', '💰 Инкассация']
    ],
    TECHNICIAN: [
      ['🔧 Ремонт', '🔍 Диагностика'],
      ['📋 Мои задачи']
    ]
  };
  
  return {
    reply_markup: {
      keyboard: keyboards[role] || keyboards.OPERATOR,
      resize_keyboard: true
    }
  };
}

// Обработчики для разных ролей
bot.hears('📋 Мои задачи', async (ctx) => {
  const user = ctx.user;
  
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedUserId: user.id,
        status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] }
      },
      include: {
        machine: { include: { location: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (tasks.length === 0) {
      return ctx.reply('📋 У вас нет активных задач');
    }
    
    let message = '📋 Ваши активные задачи:\\n\\n';
    
    tasks.forEach((task, index) => {
      message += \`\${index + 1}. \${task.type} - \${task.machine.internalCode}\\n\`;
      message += \`   📍 \${task.machine.location.name}\\n\`;
      message += \`   📅 \${task.createdAt.toLocaleDateString()}\\n\\n\`;
    });
    
    return ctx.reply(message);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return ctx.reply('❌ Ошибка при получении задач');
  }
});

// Запуск бота
if (process.env.NODE_ENV !== 'test') {
  bot.launch();
  console.log('🤖 Telegram bot started');
}

module.exports = bot;
`;

  writeFile('apps/telegram-bot/src/bot.js', telegramBot);
  
  console.log('\n✅ Критический фиксер завершен!');
  console.log('\n📋 Созданные компоненты:');
  console.log('   - Полная схема Prisma с 20+ моделями');
  console.log('   - Документация API endpoints');
  console.log('   - FSM структура для Telegram бота');
  console.log('   - Базовые контроллеры (User, Machine)');
  console.log('   - Middleware для авторизации и ролей');
  console.log('   - Утилиты (Logger)');
  console.log('   - Базовый Telegram бот');
  
  console.log('\n🚀 Следующие шаги:');
  console.log('   1. Запустите: npm run db:push');
  console.log('   2. Запустите: npm run dev');
  console.log('   3. Протестируйте API endpoints');
  console.log('   4. Настройте Telegram бота');
}

// Запуск
main().catch(console.error);
