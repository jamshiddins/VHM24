#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚨 ULTIMATE Fix for Prisma Schema - Complete Rebuild...');

const schemaPath = 'backend/prisma/schema.prisma';

// Создаем полностью рабочую схему с нуля
const workingSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Пользователи
model User {
  id          String   @id @default(cuid())
  telegramId  String   @unique @map("telegram_id")
  username    String?
  firstName   String?  @map("first_name")
  lastName    String?  @map("last_name")
  role        UserRole @default(OPERATOR)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Связи
  tasks             Task[]
  routes            Route[]
  actionLogs        ActionLog[]
  cashCollections   CashCollection[]
  expenses          Expense[]
  incomes           Income[]
  inventoryMovements InventoryMovement[]
  hopperMovements   HopperMovement[]
  waterMovements    WaterMovement[]

  @@map("users")
}

// Локации
model Location {
  id          String   @id @default(cuid())
  name        String
  address     String?
  coordinates String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Связи
  machines    Machine[]
  routes      Route[]

  @@map("locations")
}

// Автоматы
model Machine {
  id            String        @id @default(cuid())
  name          String
  model         String?
  serialNumber  String?       @map("serial_number")
  type          MachineType   @default(COFFEE)
  status        MachineStatus @default(ACTIVE)
  locationId    String?       @map("location_id")
  simCard       String?       @map("sim_card")
  electricMeter String?       @map("electric_meter")
  notes         String?
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Связи
  location        Location?         @relation(fields: [locationId], references: [id])
  bags            Bag[]
  tasks           Task[]
  routes          RouteStop[]
  sales           Sale[]
  cashCollections CashCollection[]
  expenses        Expense[]
  incomes         Income[]
  actionLogs      ActionLog[]
  movements       Movement[]
  hoppers         Hopper[]
  syrups          Syrup[]
  waterBottles    WaterBottle[]
  recipes         Recipe[]

  @@map("machines")
}

// Ингредиенты
model Ingredient {
  id                 String    @id @default(cuid())
  name               String
  type               IngredientType
  unit               String    // г, мл, шт
  shelfLifeDays      Int?      @map("shelf_life_days")
  density            Float?    // для расчётов
  autoOrderDays      Int?      @map("auto_order_days")
  autoOrderEnabled   Boolean   @default(false) @map("auto_order_enabled")
  purchasePrice      Float?    @map("purchase_price")
  minStock           Float?    @map("min_stock")
  currentStock       Float?    @map("current_stock")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  // Связи
  hoppers            Hopper[]
  recipeItems        RecipeItem[]
  inventoryMovements InventoryMovement[]

  @@map("ingredients")
}

// Бункеры
model Hopper {
  id           String       @id @default(cuid())
  code         String       @unique
  ingredientId String       @map("ingredient_id")
  machineId    String?      @map("machine_id")
  bagId        String?      @map("bag_id")
  tareWeight   Float        @map("tare_weight")
  grossWeight  Float?       @map("gross_weight")
  status       HopperStatus @default(CLEAN)
  cycles       Int          @default(0)
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  // Связи
  ingredient Ingredient      @relation(fields: [ingredientId], references: [id])
  machine    Machine?        @relation(fields: [machineId], references: [id])
  bag        Bag?            @relation(fields: [bagId], references: [id])
  movements  HopperMovement[]

  @@map("hoppers")
}

// Сумки
model Bag {
  id        String    @id @default(cuid())
  code      String    @unique
  machineId String?   @map("machine_id")
  status    BagStatus @default(PREPARED)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  // Связи
  machine Machine?  @relation(fields: [machineId], references: [id])
  hoppers Hopper[]
  syrups  Syrup[]
  tasks   Task[]

  @@map("bags")
}

// Сиропы
model Syrup {
  id        String      @id @default(cuid())
  name      String
  bottleId  String      @unique @map("bottle_id")
  volume    Float
  status    SyrupStatus @default(FULL)
  machineId String?     @map("machine_id")
  bagId     String?     @map("bag_id")
  createdAt DateTime    @default(now()) @map("created_at")
  updatedAt DateTime    @updatedAt @map("updated_at")

  // Связи
  machine Machine? @relation(fields: [machineId], references: [id])
  bag     Bag?     @relation(fields: [bagId], references: [id])

  @@map("syrups")
}

// Бутылки воды
model WaterBottle {
  id            String            @id @default(cuid())
  bottleCode    String            @unique @map("bottle_code")
  volume        Float
  grossWeight   Float             @map("gross_weight")
  tareWeight    Float             @map("tare_weight")
  status        WaterBottleStatus @default(FULL)
  machineId     String?           @map("machine_id")
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")

  // Связи
  machine   Machine?        @relation(fields: [machineId], references: [id])
  movements WaterMovement[]

  @@map("water_bottles")
}

// Рецепты
model Recipe {
  id        String   @id @default(cuid())
  name      String
  machineId String?  @map("machine_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Связи
  machine Machine?     @relation(fields: [machineId], references: [id])
  items   RecipeItem[]

  @@map("recipes")
}

// Элементы рецепта
model RecipeItem {
  id           String @id @default(cuid())
  recipeId     String @map("recipe_id")
  ingredientId String @map("ingredient_id")
  quantity     Float

  // Связи
  recipe     Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  ingredient Ingredient @relation(fields: [ingredientId], references: [id])

  @@map("recipe_items")
}

// Задачи
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  type        TaskType
  status      TaskStatus @default(PENDING)
  priority    Priority   @default(MEDIUM)
  machineId   String     @map("machine_id")
  assignedTo  String     @map("assigned_to")
  routeId     String?    @map("route_id")
  bagId       String?    @map("bag_id")
  dueDate     DateTime?  @map("due_date")
  completedAt DateTime?  @map("completed_at")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  // Связи
  machine    Machine     @relation(fields: [machineId], references: [id])
  assignee   User        @relation(fields: [assignedTo], references: [id])
  route      Route?      @relation(fields: [routeId], references: [id])
  bag        Bag?        @relation(fields: [bagId], references: [id])
  sales      Sale[]
  actionLogs ActionLog[]
  movements  Movement[]

  @@map("tasks")
}

// Маршруты
model Route {
  id         String      @id @default(cuid())
  name       String
  operatorId String      @map("operator_id")
  locationId String?     @map("location_id")
  date       DateTime
  status     RouteStatus @default(PLANNED)
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")

  // Связи
  operator User        @relation(fields: [operatorId], references: [id])
  location Location?   @relation(fields: [locationId], references: [id])
  stops    RouteStop[]
  tasks    Task[]

  @@map("routes")
}

// Остановки маршрута
model RouteStop {
  id        String   @id @default(cuid())
  routeId   String   @map("route_id")
  machineId String   @map("machine_id")
  taskId    String?  @map("task_id")
  order     Int
  createdAt DateTime @default(now()) @map("created_at")

  // Связи
  route   Route    @relation(fields: [routeId], references: [id], onDelete: Cascade)
  machine Machine  @relation(fields: [machineId], references: [id])
  task    Task?    @relation(fields: [taskId], references: [id])

  @@map("route_stops")
}

// Движение инвентаря
model InventoryMovement {
  id           String       @id @default(cuid())
  ingredientId String       @map("ingredient_id")
  userId       String       @map("user_id")
  type         MovementType
  quantity     Float
  reason       String?
  createdAt    DateTime     @default(now()) @map("created_at")

  // Связи
  ingredient Ingredient @relation(fields: [ingredientId], references: [id])
  user       User       @relation(fields: [userId], references: [id])

  @@map("inventory_movements")
}

// Движение бункеров
model HopperMovement {
  id        String       @id @default(cuid())
  hopperId  String       @map("hopper_id")
  userId    String       @map("user_id")
  taskId    String?      @map("task_id")
  type      MovementType
  weight    Float?
  reason    String?
  createdAt DateTime     @default(now()) @map("created_at")

  // Связи
  hopper Hopper @relation(fields: [hopperId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@map("hopper_movements")
}

// Движение воды
model WaterMovement {
  id       String       @id @default(cuid())
  bottleId String       @map("bottle_id")
  userId   String       @map("user_id")
  type     MovementType
  weight   Float?
  reason   String?
  createdAt DateTime    @default(now()) @map("created_at")

  // Связи
  bottle WaterBottle @relation(fields: [bottleId], references: [id])
  user   User        @relation(fields: [userId], references: [id])

  @@map("water_movements")
}

// Журнал действий
model ActionLog {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  action     String
  objectType String   @map("object_type")
  objectId   String   @map("object_id")
  oldValues  Json?    @map("old_values")
  newValues  Json?    @map("new_values")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")

  // Связи
  user    User     @relation(fields: [userId], references: [id])
  machine Machine? @relation(fields: [objectId], references: [id])
  task    Task?    @relation(fields: [objectId], references: [id])

  @@map("action_logs")
}

// Продажи
model Sale {
  id          String     @id @default(cuid())
  machineId   String     @map("machine_id")
  taskId      String?    @map("task_id")
  productName String     @map("product_name")
  amount      Float
  paymentType PaymentType @map("payment_type")
  saleDate    DateTime   @map("sale_date")
  createdAt   DateTime   @default(now()) @map("created_at")

  // Связи
  machine Machine @relation(fields: [machineId], references: [id])
  task    Task?   @relation(fields: [taskId], references: [id])

  @@map("sales")
}

// Инкассация
model CashCollection {
  id          String               @id @default(cuid())
  machineId   String               @map("machine_id")
  collectorId String               @map("collector_id")
  amount      Float
  photoUrl    String?              @map("photo_url")
  status      CashCollectionStatus @default(COLLECTED)
  collectedAt DateTime             @map("collected_at")
  verifiedAt  DateTime?            @map("verified_at")
  verifiedBy  String?              @map("verified_by")
  comment     String?
  createdAt   DateTime             @default(now()) @map("created_at")

  // Связи
  machine   Machine @relation(fields: [machineId], references: [id])
  collector User    @relation(fields: [collectorId], references: [id])

  @@map("cash_collections")
}

// Расходы
model Expense {
  id          String          @id @default(cuid())
  category    ExpenseCategory
  description String
  amount      Float
  machineId   String?         @map("machine_id")
  userId      String          @map("user_id")
  expenseDate DateTime        @map("expense_date")
  createdAt   DateTime        @default(now()) @map("created_at")

  // Связи
  machine Machine? @relation(fields: [machineId], references: [id])
  user    User     @relation(fields: [userId], references: [id])

  @@map("expenses")
}

// Доходы
model Income {
  id          String         @id @default(cuid())
  category    IncomeCategory
  description String
  amount      Float
  source      String?
  machineId   String?        @map("machine_id")
  userId      String         @map("user_id")
  incomeDate  DateTime       @map("income_date")
  createdAt   DateTime       @default(now()) @map("created_at")

  // Связи
  machine Machine? @relation(fields: [machineId], references: [id])
  user    User     @relation(fields: [userId], references: [id])

  @@map("incomes")
}

// Движения
model Movement {
  id          String       @id @default(cuid())
  type        MovementType
  description String?
  quantity    Float?
  userId      String       @map("user_id")
  machineId   String?      @map("machine_id")
  taskId      String?      @map("task_id")
  itemId      String?      @map("item_id")
  createdAt   DateTime     @default(now()) @map("created_at")

  // Связи
  user    User     @relation(fields: [userId], references: [id])
  machine Machine? @relation(fields: [machineId], references: [id])
  task    Task?    @relation(fields: [taskId], references: [id])
  item    Item?    @relation(fields: [itemId], references: [id])

  @@map("movements")
}

// Предметы
model Item {
  id          String     @id @default(cuid())
  name        String
  description String?
  category    String
  unit        String     @default("шт")
  price       Float?
  barcode     String?
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  // Связи
  movements Movement[]

  @@map("items")
}

// Enums
enum UserRole {
  ADMIN
  MANAGER
  WAREHOUSE
  OPERATOR
  TECHNICIAN
  DRIVER
}

enum MachineType {
  COFFEE
  SNACK
  BEVERAGE
  COMBO
}

enum MachineStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  BROKEN
}

enum IngredientType {
  COFFEE
  MILK
  SUGAR
  SYRUP
  WATER
  OTHER
}

enum HopperStatus {
  CLEAN
  FILLED
  DIRTY
  MAINTENANCE
  BROKEN
}

enum BagStatus {
  PREPARED
  ASSIGNED
  IN_USE
  RETURNED
  MAINTENANCE
}

enum SyrupStatus {
  FULL
  PARTIAL
  EMPTY
  EXPIRED
}

enum WaterBottleStatus {
  FULL
  PARTIAL
  EMPTY
  MAINTENANCE
}

enum TaskType {
  MAINTENANCE
  REFILL
  CLEANING
  REPAIR
  INSPECTION
  COLLECTION
  DELIVERY
  OTHER
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
  FAILED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum RouteStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum MovementType {
  IN
  OUT
  TRANSFER
  ADJUSTMENT
  WASTE
}

enum PaymentType {
  CASH
  CARD
  QR
  OTHER
}

enum CashCollectionStatus {
  COLLECTED
  VERIFIED
  DEPOSITED
  DISCREPANCY
}

enum ExpenseCategory {
  INGREDIENTS
  MAINTENANCE
  UTILITIES
  RENT
  SALARIES
  TRANSPORT
  OTHER
}

enum IncomeCategory {
  SALES
  INVESTMENT
  REFUND
  OTHER
}
`;

console.log('💾 Writing completely new working schema...');
fs.writeFileSync(schemaPath, workingSchema);

console.log('✅ New schema written!');
console.log('🔄 Generating Prisma client...');

const { execSync } = require('child_process');

try {
    execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully!');
    
    console.log('🔄 Formatting schema...');
    execSync('cd backend && npx prisma format', { stdio: 'inherit' });
    console.log('✅ Schema formatted!');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

console.log('🎉 Prisma schema completely rebuilt and working!');
