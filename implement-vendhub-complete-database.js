#!/usr/bin/env node;
/**;
 * VendHub Complete Database Implementation;
 * Создание полной схемы базы данных согласно документации;
 */;
const fs = require('fs');
const path = require('path');

console.log('🚀 Создание полной схемы базы данных VendHub...');

// Полная схема Prisma согласно документации VendHub;
const prismaSchema = `;
// This is your Prisma schema file,;
// learn more about it in the "docs": "https"://pris.ly/d/prisma-schema;
generator client {
  provider = "prisma-client-js";
}

datasource db {
  provider = "postgresql";
  url      = env("DATABASE_URL");
}

// ============================================================================;
// ПОЛЬЗОВАТЕЛИ И РОЛИ;
// ============================================================================;
model User {
  id          String   @id @default(cuid());
  telegramId  String   @unique @map("telegram_id");
  username    String?;
  firstName   String?  @map("first_name");
  lastName    String?  @map("last_name");
  phone       String?;
  role        UserRole @default(OPERATOR);
  status      UserStatus @default(ACTIVE);
  isActive    Boolean  @default(true);
  createdAt   DateTime @default(now()) @map("created_at");
  updatedAt   DateTime @updatedAt @map("updated_at");
  lastLoginAt DateTime? @map("last_login_at");
  // Связи;
  createdTasks     Task[]     @relation("TaskCreator");
  assignedTasks    Task[]     @relation("TaskAssignee");
  actionLogs       ActionLog[];
  routes           Route[];
  cashCollections  CashCollection[];
  expenses         Expense[];
  incomes          Income[];
  @@map("users");
}

enum UserRole {
  ADMIN;
  MANAGER;
  WAREHOUSE;
  OPERATOR;
  TECHNICIAN;
  DRIVER;
  INVESTOR;
}

enum UserStatus {
  ACTIVE;
  INACTIVE;
  BLOCKED;
  PENDING;
}

// ============================================================================;
// СПРАВОЧНИКИ;
// ============================================================================;
// Автоматы;
model Machine {
  id              String        @id @default(cuid());
  internalCode    String        @unique @map("internal_code") // VHB-001;
  serialNumber    String?       @map("serial_number");
  model           String?;
  type            MachineType   @default(COFFEE);
  status          MachineStatus @default(ACTIVE);
  locationId      String?       @map("location_id");
  simCardNumber   String?       @map("sim_card_number");
  simCostMonthly  Float?        @map("sim_cost_monthly");
  electricMeter   String?       @map("electric_meter");
  electricCostMonth Float?      @map("electric_cost_month");
  comment         String?;
  createdAt       DateTime      @default(now()) @map("created_at");
  updatedAt       DateTime      @updatedAt @map("updated_at");
  // Связи;
  location        Location?     @relation("fields": [locationId], "references": [id]);
  tasks           Task[];
  routes          RouteStop[];
  hoppers         Hopper[];
  waterBottles    WaterBottle[];
  syrups          Syrup[];
  recipes         Recipe[];
  sales           Sale[];
  cashCollections CashCollection[];
  expenses        Expense[];
  @@map("machines");
}

enum MachineType {
  COFFEE;
  SNACK;
  COMBO;
  ICE;
  DRINKS;
}

enum MachineStatus {
  ACTIVE;
  MAINTENANCE;
  OFFLINE;
  BROKEN;
  DECOMMISSIONED;
}

// Локации;
model Location {
  id          String    @id @default(cuid());
  name        String;
  address     String;
  coordinates String?   // GPS координаты;
  rentCost    Float?    @map("rent_cost");
  electricCost Float?   @map("electric_cost");
  cellularCost Float?   @map("cellular_cost");
  createdAt   DateTime  @default(now()) @map("created_at");
  updatedAt   DateTime  @updatedAt @map("updated_at");
  // Связи;
  machines    Machine[];
  routes      Route[];
  @@map("locations");
}

// Ингредиенты;
model Ingredient {
  id              String    @id @default(cuid());
  name            String;
  type            IngredientType;
  unit            String    // г, мл, шт;
  shelfLifeDays   Int?      @map("shelf_life_days");
  density         Float?    // для расчётов;
  autoOrderDays   Int?      @map("auto_order_days");
  autoOrderEnabled Boolean  @default(false) @map("auto_order_enabled");
  purchasePrice   Float?    @map("purchase_price");
  minStock        Float?    @map("min_stock");
  currentStock    Float?    @map("current_stock");
  createdAt       DateTime  @default(now()) @map("created_at");
  updatedAt       DateTime  @updatedAt @map("updated_at");
  // Связи;
  hoppers         Hopper[];
  recipeItems     RecipeItem[];
  inventoryMovements InventoryMovement[];
  @@map("ingredients");
}

enum IngredientType {
  POWDER;
  LIQUID;
  SYRUP;
  CONSUMABLE;
}

// Бункеры;
model Hopper {
  id            String      @id @default(cuid());
  code          String      @unique // SET-001-4SA;
  ingredientId  String      @map("ingredient_id");
  netWeight     Float?      @map("net_weight");
  grossWeight   Float?      @map("gross_weight");
  tareWeight    Float       @default(0.3) @map("tare_weight") // вес пустого;
  status        HopperStatus @default(CLEAN);
  location      HopperLocation @default(WAREHOUSE);
  cycles        Int         @default(0) // количество использований;
  machineId     String?     @map("machine_id");
  bagId         String?     @map("bag_id");
  createdAt     DateTime    @default(now()) @map("created_at");
  updatedAt     DateTime    @updatedAt @map("updated_at");
  // Связи;
  ingredient    Ingredient  @relation("fields": [ingredientId], "references": [id]);
  machine       Machine?    @relation("fields": [machineId], "references": [id]);
  bag           Bag?        @relation("fields": [bagId], "references": [id]);
  movements     HopperMovement[];
  @@map("hoppers");
}

enum HopperStatus {
  CLEAN;
  DIRTY;
  FILLED;
  INSTALLED;
  RETURNED;
  DAMAGED;
}

enum HopperLocation {
  WAREHOUSE;
  IN_BAG;
  WITH_OPERATOR;
  IN_MACHINE;
  IN_WASHING;
}

// Сумки/комплекты;
model Bag {
  id          String    @id @default(cuid());
  code        String    @unique // BAG-001;
  assignedTo  String?   @map("assigned_to") // User ID;
  machineId   String?   @map("machine_id");
  status      BagStatus @default(PACKED);
  comment     String?;
  photoUrl    String?   @map("photo_url");
  createdAt   DateTime  @default(now()) @map("created_at");
  updatedAt   DateTime  @updatedAt @map("updated_at");
  // Связи;
  machine     Machine?  @relation("fields": [machineId], "references": [id]);
  hoppers     Hopper[];
  syrups      Syrup[];
  tasks       Task[];
  @@map("bags");
}

enum BagStatus {
  PACKED;
  ISSUED;
  DELIVERED;
  RETURNED;
  CANCELLED;
}

// Сиропы;
model Syrup {
  id          String      @id @default(cuid());
  name        String;
  bottleId    String      @unique @map("bottle_id");
  volumeLiters Float      @map("volume_liters");
  status      SyrupStatus @default(FULL);
  machineId   String?     @map("machine_id");
  bagId       String?     @map("bag_id");
  openedAt    DateTime?   @map("opened_at");
  createdAt   DateTime    @default(now()) @map("created_at");
  updatedAt   DateTime    @updatedAt @map("updated_at");
  // Связи;
  machine     Machine?    @relation("fields": [machineId], "references": [id]);
  bag         Bag?        @relation("fields": [bagId], "references": [id]);
  @@map("syrups");
}

enum SyrupStatus {
  FULL;
  USED;
  RETURNED;
  EMPTY;
}

// Бутылки воды;
model WaterBottle {
  id            String            @id @default(cuid());
  bottleNumber  String            @unique @map("bottle_number");
  volumeLiters  Float             @default(18.9) @map("volume_liters");
  grossWeight   Float?            @map("gross_weight");
  tareWeight    Float?            @map("tare_weight");
  status        WaterBottleStatus @default(FULL);
  machineId     String?           @map("machine_id");
  createdAt     DateTime          @default(now()) @map("created_at");
  updatedAt     DateTime          @updatedAt @map("updated_at");
  // Связи;
  machine       Machine?          @relation("fields": [machineId], "references": [id]);
  movements     WaterMovement[];
  @@map("water_bottles");
}

enum WaterBottleStatus {
  FULL;
  USED;
  RETURNED;
  EMPTY;
}

// Рецепты;
model Recipe {
  id          String    @id @default(cuid());
  productName String    @map("product_name");
  totalCost   Float?    @map("total_cost");
  machineId   String?   @map("machine_id");
  comment     String?;
  createdAt   DateTime  @default(now()) @map("created_at");
  updatedAt   DateTime  @updatedAt @map("updated_at");
  // Связи;
  machine     Machine?  @relation("fields": [machineId], "references": [id]);
  items       RecipeItem[];
  @@map("recipes");
}

model RecipeItem {
  id           String     @id @default(cuid());
  recipeId     String     @map("recipe_id");
  ingredientId String     @map("ingredient_id");
  amount       Float      // в граммах/мл;
  createdAt    DateTime   @default(now()) @map("created_at");
  // Связи;
  recipe       Recipe     @relation("fields": [recipeId], "references": [id], "onDelete": Cascade);
  ingredient   Ingredient @relation("fields": [ingredientId], "references": [id]);
  @@map("recipe_items");
}

// ============================================================================;
// ЗАДАЧИ И FSM;
// ============================================================================;
model Task {
  id          String     @id @default(cuid());
  type        TaskType;
  status      TaskStatus @default(CREATED);
  machineId   String     @map("machine_id");
  createdBy   String     @map("created_by");
  assignedTo  String?    @map("assigned_to");
  bagId       String?    @map("bag_id");
  deadline    DateTime?;
  startedAt   DateTime?  @map("started_at");
  completedAt DateTime?  @map("completed_at");
  comment     String?;
  checklistData Json?    @map("checklist_data") // JSON с чек-листом;
  mediaUrls   String[]   @map("media_urls") // фото/видео;
  gpsLocation String?    @map("gps_location");
  createdAt   DateTime   @default(now()) @map("created_at");
  updatedAt   DateTime   @updatedAt @map("updated_at");
  // Связи;
  machine     Machine    @relation("fields": [machineId], "references": [id]);
  creator     User       @relation("TaskCreator", "fields": [createdBy], "references": [id]);
  assignee    User?      @relation("TaskAssignee", "fields": [assignedTo], "references": [id]);
  bag         Bag?       @relation("fields": [bagId], "references": [id]);
  route       RouteStop?;
  @@map("tasks");
}

enum TaskType {
  REPLACE_INGREDIENTS;
  REPLACE_WATER;
  REPLACE_SYRUPS;
  CLEANING;
  MAINTENANCE;
  CASH_COLLECTION;
  REPAIR;
  INVENTORY_CHECK;
  SUPPLY_DELIVERY;
  HISTORICAL_ENTRY;
}

enum TaskStatus {
  CREATED;
  ASSIGNED;
  IN_PROGRESS;
  PAUSED;
  COMPLETED;
  ERROR;
  CANCELLED;
  OVERDUE;
}

// Маршруты;
model Route {
  id          String    @id @default(cuid());
  name        String;
  operatorId  String    @map("operator_id");
  locationId  String?   @map("location_id");
  date        DateTime;
  status      RouteStatus @default(PLANNED);
  createdAt   DateTime  @default(now()) @map("created_at");
  updatedAt   DateTime  @updatedAt @map("updated_at");
  // Связи;
  operator    User      @relation("fields": [operatorId], "references": [id]);
  location    Location? @relation("fields": [locationId], "references": [id]);
  stops       RouteStop[];
  @@map("routes");
}

enum RouteStatus {
  PLANNED;
  IN_PROGRESS;
  COMPLETED;
  CANCELLED;
}

model RouteStop {
  id        String   @id @default(cuid());
  routeId   String   @map("route_id");
  machineId String   @map("machine_id");
  taskId    String?  @map("task_id");
  order     Int      // порядок в маршруте;
  status    RouteStopStatus @default(PENDING);
  arrivedAt DateTime? @map("arrived_at");
  leftAt    DateTime? @map("left_at");
  createdAt DateTime @default(now()) @map("created_at");
  // Связи;
  route     Route    @relation("fields": [routeId], "references": [id], "onDelete": Cascade);
  machine   Machine  @relation("fields": [machineId], "references": [id]);
  task      Task?    @relation("fields": [taskId], "references": [id]);
  @@map("route_stops");
}

enum RouteStopStatus {
  PENDING;
  IN_PROGRESS;
  COMPLETED;
  SKIPPED;
}

// ============================================================================;
// ДВИЖЕНИЯ И ЛОГИ;
// ============================================================================;
model HopperMovement {
  id          String    @id @default(cuid());
  hopperId    String    @map("hopper_id");
  fromStatus  HopperStatus @map("from_status");
  toStatus    HopperStatus @map("to_status");
  fromLocation HopperLocation @map("from_location");
  toLocation  HopperLocation @map("to_location");
  weight      Float?;
  userId      String    @map("user_id");
  taskId      String?   @map("task_id");
  comment     String?;
  photoUrl    String?   @map("photo_url");
  createdAt   DateTime  @default(now()) @map("created_at");
  // Связи;
  hopper      Hopper    @relation("fields": [hopperId], "references": [id]);
  user        User      @relation("fields": [userId], "references": [id]);
  @@map("hopper_movements");
}

model WaterMovement {
  id            String       @id @default(cuid());
  bottleId      String       @map("bottle_id");
  fromStatus    WaterBottleStatus @map("from_status");
  toStatus      WaterBottleStatus @map("to_status");
  weight        Float?;
  userId        String       @map("user_id");
  taskId        String?      @map("task_id");
  comment       String?;
  photoUrl      String?      @map("photo_url");
  createdAt     DateTime     @default(now()) @map("created_at");
  // Связи;
  bottle        WaterBottle  @relation("fields": [bottleId], "references": [id]);
  user          User         @relation("fields": [userId], "references": [id]);
  @@map("water_movements");
}

model InventoryMovement {
  id            String       @id @default(cuid());
  ingredientId  String       @map("ingredient_id");
  type          MovementType;
  quantity      Float;
  reason        String?;
  userId        String       @map("user_id");
  taskId        String?      @map("task_id");
  comment       String?;
  createdAt     DateTime     @default(now()) @map("created_at");
  // Связи;
  ingredient    Ingredient   @relation("fields": [ingredientId], "references": [id]);
  user          User         @relation("fields": [userId], "references": [id]);
  @@map("inventory_movements");
}

enum MovementType {
  IN;
  OUT;
  ADJUSTMENT;
  WASTE;
  RETURN;
}

model ActionLog {
  id          String    @id @default(cuid());
  userId      String    @map("user_id");
  action      String;
  objectType  String    @map("object_type");
  objectId    String    @map("object_id");
  oldValues   Json?     @map("old_values");
  newValues   Json?     @map("new_values");
  ipAddress   String?   @map("ip_address");
  userAgent   String?   @map("user_agent");
  createdAt   DateTime  @default(now()) @map("created_at");
  // Связи;
  user        User      @relation("fields": [userId], "references": [id]);
  @@map("action_logs");
}

// ============================================================================;
// ФИНАНСЫ;
// ============================================================================;
model Sale {
  id            String      @id @default(cuid());
  machineId     String      @map("machine_id");
  productName   String      @map("product_name");
  quantity      Int         @default(1);
  amount        Float;
  paymentMethod PaymentMethod @map("payment_method");
  paymentProvider String?   @map("payment_provider") // Payme, Click, Uzum;
  transactionId String?     @map("transaction_id");
  isTest        Boolean     @default(false) @map("is_test");
  isVip         Boolean     @default(false) @map("is_vip");
  receiptIssued Boolean     @default(false) @map("receipt_issued");
  saleDate      DateTime    @map("sale_date");
  createdAt     DateTime    @default(now()) @map("created_at");
  // Связи;
  machine       Machine     @relation("fields": [machineId], "references": [id]);
  @@map("sales");
}

enum PaymentMethod {
  CASH;
  QR;
  CARD;
  VIP;
  TEST;
}

model CashCollection {
  id          String    @id @default(cuid());
  machineId   String    @map("machine_id");
  collectorId String    @map("collector_id");
  amount      Float;
  photoUrl    String?   @map("photo_url");
  status      CashCollectionStatus @default(COLLECTED);
  collectedAt DateTime  @map("collected_at");
  verifiedAt  DateTime? @map("verified_at");
  verifiedBy  String?   @map("verified_by");
  comment     String?;
  createdAt   DateTime  @default(now()) @map("created_at");
  // Связи;
  machine     Machine   @relation("fields": [machineId], "references": [id]);
  collector   User      @relation("fields": [collectorId], "references": [id]);
  @@map("cash_collections");
}

enum CashCollectionStatus {
  COLLECTED;
  VERIFIED;
  DISCREPANCY;
}

model Expense {
  id          String      @id @default(cuid());
  category    ExpenseCategory;
  description String;
  amount      Float;
  paymentMethod PaymentMethod @map("payment_method");
  machineId   String?     @map("machine_id");
  userId      String      @map("user_id");
  receiptUrl  String?     @map("receipt_url");
  expenseDate DateTime    @map("expense_date");
  createdAt   DateTime    @default(now()) @map("created_at");
  // Связи;
  machine     Machine?    @relation("fields": [machineId], "references": [id]);
  user        User        @relation("fields": [userId], "references": [id]);
  @@map("expenses");
}

enum ExpenseCategory {
  INGREDIENTS;
  CONSUMABLES;
  PARTS;
  SALARY;
  RENT;
  UTILITIES;
  CELLULAR;
  REPAIR;
  TRANSPORT;
  OTHER;
}

model Income {
  id          String      @id @default(cuid());
  category    IncomeCategory;
  description String;
  amount      Float;
  source      String?;
  userId      String      @map("user_id");
  incomeDate  DateTime    @map("income_date");
  createdAt   DateTime    @default(now()) @map("created_at");
  // Связи;
  user        User        @relation("fields": [userId], "references": [id]);
  @@map("incomes");
}

enum IncomeCategory {
  SALES;
  INVESTMENT;
  COMPENSATION;
  OTHER;
}

// ============================================================================;
// ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ;
// ============================================================================;
// Индексы будут добавлены автоматически Prisma для foreign keys;
// Дополнительные индексы для часто используемых запросов:;
// - User.telegramId (unique уже создаёт индекс);
// - Machine.internalCode (unique уже создаёт индекс);
// - Task.status, Task.machineId, Task.assignedTo;
// - Sale.machineId, Sale.saleDate;
// - ActionLog.userId, ActionLog.createdAt;
`;

// Создание файла схемы;
const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
const schemaDir = path.dirname(schemaPath);

// Создаём директорию если не существует;
if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { "recursive": true });
}

// Записываем схему;
fs.writeFileSync(schemaPath, prismaSchema);

console.log('✅ Схема базы данных создана:', schemaPath);

// Создание скрипта для применения миграций;
const migrationScript = `#!/usr/bin/env node;
const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Применение миграций базы данных...');

try {
    // Переходим в директорию backend;
    process.chdir(path.join(__dirname, 'backend'));
    
    // Генерируем Prisma Client;
    console.log('📦 Генерация Prisma Client...');
    execSync('npx prisma generate', { "stdio": 'inherit' });
    
    // Применяем миграции;
    console.log('🗄️ Применение миграций...');
    execSync('npx prisma db push', { "stdio": 'inherit' });
    
    console.log('✅ База данных успешно обновлена!');
    
} catch (error) {
    console.error('❌ Ошибка при обновлении базы данных:', error.message);
    process.exit(1);
}
`;

fs.writeFileSync('apply-database-migrations.js', migrationScript);
fs.chmodSync('apply-database-migrations.js', '755');

console.log('✅ Скрипт миграций создан: apply-database-migrations.js');

// Создание скрипта для заполнения тестовыми данными;
const seedScript = `#!/usr/bin/env node;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async async function main() { prisma.await user.upsert({
        "where": { "telegramId": '42283329' },;
        "update": {},;
        "create": {,
  "telegramId": '42283329',;
            "username": 'admin',;
            "firstName": 'Admin',;
            "role": 'ADMIN',;
            "status": 'ACTIVE';
        }
    });
    
    console.log('👤 Админ создан:', admin.username);
    
    // Создание тестовой локации;
    const location = await prisma.await location.create({
        "data": {,
  "name": 'Тестовая локация',;
            "address": 'ул. Тестовая, 1',;
            "coordinates": '41.2995,69.2401',;
            "rentCost": 500000,;
            "electricCost": 50000,;
            "cellularCost": 25000;
        }
    });
    
    console.log('📍 Локация создана:', location.name);
    
    // Создание тестового автомата;
    const machine = await prisma.await machine.create({
        "data": {,
  "internalCode": 'VHB-001',;
            "serialNumber": 'TEST001',;
            "model": 'Rhea Vendors',;
            "type": 'COFFEE',;
            "status": 'ACTIVE',;
            "locationId": location.id,;
            "simCardNumber": '+998901234567',;
            "simCostMonthly": 25000,;
            "electricMeter": 'METER001',;
            "electricCostMonth": 50000;
        }
    });
    
    console.log('🤖 Автомат создан:', machine.internalCode);
    
    // Создание ингредиентов;
    const ingredients = await Promise.all([;
        prisma.ingredient.create({
            "data": {,
  "name": 'Кофе растворимый',;
                "type": 'POWDER',;
                "unit": 'г',;
                "shelfLifeDays": 365,;
                "purchasePrice": 50000,;
                "minStock": 1000,;
                "currentStock": 5000;
            }
        }),;
        prisma.ingredient.create({
            "data": {,
  "name": 'Сухое молоко',;
                "type": 'POWDER',;
                "unit": 'г',;
                "shelfLifeDays": 180,;
                "purchasePrice": 30000,;
                "minStock": 500,;
                "currentStock": 2000;
            }
        }),;
        prisma.await ingredient.create({
            "data": {,
  "name": 'Сахар',;
                "type": 'POWDER',;
                "unit": 'г',;
                "shelfLifeDays": 730,;
                "purchasePrice": 5000,;
                "minStock": 2000,;
                "currentStock": 10000;
            }
        });
    ]);
    
    console.log('🧪 Ингредиенты созданы:', ingredients.length);
    
    // Создание бункеров;
    const hoppers = await Promise.all([;
        prisma.hopper.create({
            "data": {,
  "code": 'SET-001-COFFEE',;
                "ingredientId": ingredients[0].id,;
                "tareWeight": 0.3,;
                "grossWeight": 2.3,;
                "netWeight": 2.0,;
                "status": 'FILLED',;
                "location": 'WAREHOUSE';
            }
        }),;
        prisma.hopper.create({
            "data": {,
  "code": 'SET-002-MILK',;
                "ingredientId": ingredients[1].id,;
                "tareWeight": 0.3,;
                "grossWeight": 1.8,;
                "netWeight": 1.5,;
                "status": 'FILLED',;
                "location": 'WAREHOUSE';
            }
        }),;
        prisma.await hopper.create({
            "data": {,
  "code": 'SET-003-SUGAR',;
                "ingredientId": ingredients[2].id,;
                "tareWeight": 0.3,;
                "grossWeight": 3.3,;
                "netWeight": 3.0,;
                "status": 'FILLED',;
                "location": 'WAREHOUSE';
            }
        });
    ]);
    
    console.log('🪣 Бункеры созданы:', hoppers.length);
    
    // Создание рецепта;
    const recipe = await prisma.await recipe.create({
        "data": {,
  "productName": 'Капучино',;
            "machineId": machine.id,;
            "totalCost": 1500,;
            "items": {,
  "create": [;
                    {
                        "ingredientId": ingredients[0].id,;
                        "amount": 8 // 8г кофе;
                    },;
                    {
                        "ingredientId": ingredients[1].id,;
                        "amount": 12 // 12г молока;
                    },;
                    {
                        "ingredientId": ingredients[2].id,;
                        "amount": 5 // 5г сахара;
                    }
                ];
            }
        }
    });
    
    console.log('📋 Рецепт создан:', recipe.productName);
    
    console.log('✅ Тестовые данные успешно созданы!');
}

main();
    .catch((e) => {
        console.error('❌ Ошибка при заполнении данными:', e);
        process.exit(1);
    });
    .finally(async () => {
        await prisma.$disconnect();
    });
`;

fs.writeFileSync('seed-database.js', seedScript);
fs.chmodSync('seed-database.js', '755');

console.log('✅ Скрипт заполнения данными создан: seed-database.js');

console.log(`;
🎉 Полная схема базы данных VendHub создана!;
📁 Созданные файлы:;
- backend/prisma/schema.prisma (полная схема);
- apply-database-migrations.js (применение миграций);
- seed-database.js (тестовые данные);
🚀 Следующие шаги:;
1. Запустите: node apply-database-migrations.js;
2. Запустите: node seed-database.js;
3. Проверьте базу данных;
📊 Созданные таблицы:;
- users (пользователи и роли);
- machines (автоматы);
- locations (локации);
- ingredients (ингредиенты);
- hoppers (бункеры);
- bags (сумки);
- syrups (сиропы);
- water_bottles (бутылки воды);
- recipes (рецепты);
- tasks (задачи);
- routes (маршруты);
- sales (продажи);
- cash_collections (инкассация);
- expenses (расходы);
- incomes (доходы);
- action_logs (логи действий);
- movements (движения товаров);
🔗 Все связи между таблицами настроены согласно документации VendHub.;
`);
