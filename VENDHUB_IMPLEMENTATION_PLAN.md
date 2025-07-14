# План поэтапного внедрения VendHubBot в VHM24

## Анализ текущего состояния

### Существующая архитектура VHM24
- ✅ Базовая система пользователей с ролями (User, UserRole)
- ✅ Система автоматов (Machine, MachineStatus) 
- ✅ Базовая система задач (Task, TaskAction)
- ✅ Система инвентаря (InventoryItem, MachineInventory, StockMovement)
- ✅ Система маршрутов (Route, RouteStop, DriverLog)
- ✅ Система бункеров (Bunker, BunkerOperation)
- ✅ Audit логи и уведомления
- ✅ Базовая телеметрия

### Требуемые дополнения из ТЗ VendHubBot
- 🔄 Расширенная ролевая модель
- 🔄 Система справочников (сиропы, вода, сумки, расходники)
- 🔄 FSM Telegram-бот интерфейс
- 🔄 Система чек-листов и шаблонов задач
- 🔄 Финансовый модуль (доходы, расходы, инкассация)
- 🔄 Система сверки продаж и платежей
- 🔄 Расширенная отчетность и аналитика
- 🔄 Система рецептов и себестоимости

---

## ЭТАП 1: Расширение базовой модели данных (1-2 недели)

### 1.1 Дополнение ролевой системы
```prisma
// Добавить новые роли в enum UserRole
enum UserRole {
  ADMIN
  MANAGER
  WAREHOUSE
  OPERATOR
  TECHNICIAN
  DRIVER
  INVESTOR // новая роль
}

// Расширить модель User
model User {
  // ... существующие поля
  telegramUsername String? @unique
  warehouseAccess  Boolean @default(false)
  assignedMachines String[] // ID автоматов, к которым есть доступ
  
  // Новые связи
  bags           Bag[]
  waterBottles   WaterBottle[]
  syrupBottles   SyrupBottle[]
  incassations   Incassation[]
  expenses       Expense[]
  revenues       Revenue[]
}
```

### 1.2 Создание справочников
```prisma
// Сиропы
model SyrupBottle {
  id          String            @id @default(cuid())
  name        String            // ваниль, карамель, кокос
  bottleId    String   @unique  // уникальный номер бутылки
  volume      Float             // объем в литрах
  status      SyrupBottleStatus @default(ON_WAREHOUSE)
  openedAt    DateTime?         // дата открытия
  expiryDate  DateTime?         // срок годности
  assignedTo  String?           // кому назначена
  machineId   String?           // в каком автомате
  photos      String[]          // фото бутылки
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  user        User?             @relation(fields: [assignedTo], references: [id])
  machine     Machine?          @relation(fields: [machineId], references: [id])
  operations  SyrupOperation[]
}

// Вода
model WaterBottle {
  id             String            @id @default(cuid())
  bottleId       String   @unique  // уникальный номер
  volume         Float             // объем (18.9л)
  weightEmpty    Float             // вес пустой
  weightFull     Float             // вес полной
  weightCurrent  Float             // текущий вес
  status         WaterBottleStatus @default(ON_WAREHOUSE)
  assignedTo     String?           // кому назначена
  machineId      String?           // в каком автомате
  photos         String[]          // фото бутылки и наклейки
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  
  user           User?             @relation(fields: [assignedTo], references: [id])
  machine        Machine?          @relation(fields: [machineId], references: [id])
  operations     WaterOperation[]
}

// Сумки/комплекты
model Bag {
  id          String    @id @default(cuid())
  bagId       String    @unique // номер сумки
  status      BagStatus @default(CREATED)
  assignedTo  String?   // кому назначена
  machineId   String?   // для какого автомата
  description String?   // описание содержимого
  photos      String[]  // фото упаковки
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User?     @relation(fields: [assignedTo], references: [id])
  machine     Machine?  @relation(fields: [machineId], references: [id])
  contents    BagContent[]
  operations  BagOperation[]
}

// Содержимое сумки
model BagContent {
  id         String @id @default(cuid())
  bagId      String
  bunkerId   String?
  syrupId    String?
  itemId     String? // расходники
  quantity   Float?
  
  bag        Bag           @relation(fields: [bagId], references: [id])
  bunker     Bunker?       @relation(fields: [bunkerId], references: [id])
  syrup      SyrupBottle?  @relation(fields: [syrupId], references: [id])
  item       InventoryItem? @relation(fields: [itemId], references: [id])
}
```

### 1.3 Система операций с объектами
```prisma
// Операции с сиропами
model SyrupOperation {
  id          String              @id @default(cuid())
  syrupId     String
  userId      String
  type        SyrupOperationType
  description String
  photos      String[]
  eventTime   DateTime            // время события
  inputTime   DateTime            @default(now()) // время ввода
  metadata    Json?
  
  syrup       SyrupBottle         @relation(fields: [syrupId], references: [id])
  user        User                @relation(fields: [userId], references: [id])
}

// Операции с водой
model WaterOperation {
  id          String              @id @default(cuid())
  bottleId    String
  userId      String
  type        WaterOperationType
  description String
  weightBefore Float?
  weightAfter  Float?
  photos      String[]
  eventTime   DateTime
  inputTime   DateTime            @default(now())
  metadata    Json?
  
  bottle      WaterBottle         @relation(fields: [bottleId], references: [id])
  user        User                @relation(fields: [userId], references: [id])
}

// Операции с сумками
model BagOperation {
  id          String             @id @default(cuid())
  bagId       String
  userId      String
  type        BagOperationType
  description String
  photos      String[]
  eventTime   DateTime
  inputTime   DateTime           @default(now())
  metadata    Json?
  
  bag         Bag                @relation(fields: [bagId], references: [id])
  user        User               @relation(fields: [userId], references: [id])
}
```

---

## ЭТАП 2: Финансовый модуль (2-3 недели)

### 2.1 Система доходов и расходов
```prisma
// Доходы
model Revenue {
  id           String         @id @default(cuid())
  amount       Float
  currency     String         @default("UZS")
  source       RevenueSource
  machineId    String?
  userId       String?
  paymentType  PaymentType
  isTest       Boolean        @default(false) // тестовая продажа
  fiscalized   Boolean        @default(false) // фискализирован
  description  String?
  metadata     Json?
  photos       String[]       // фото чеков
  eventTime    DateTime       // время события
  inputTime    DateTime       @default(now())
  createdAt    DateTime       @default(now())
  
  machine      Machine?       @relation(fields: [machineId], references: [id])
  user         User?          @relation(fields: [userId], references: [id])
}

// Расходы
model Expense {
  id           String         @id @default(cuid())
  amount       Float
  currency     String         @default("UZS")
  category     ExpenseCategory
  subcategory  String?
  machineId    String?
  userId       String
  paymentMethod PaymentMethod
  supplierId   String?
  description  String
  receiptPhoto String?        // фото чека
  status       ExpenseStatus  @default(PENDING)
  metadata     Json?
  eventTime    DateTime
  inputTime    DateTime       @default(now())
  createdAt    DateTime       @default(now())
  
  machine      Machine?       @relation(fields: [machineId], references: [id])
  user         User           @relation(fields: [userId], references: [id])
  supplier     Supplier?      @relation(fields: [supplierId], references: [id])
}

// Инкассация
model Incassation {
  id          String           @id @default(cuid())
  machineId   String
  operatorId  String
  managerId   String?
  amount      Float
  photos      String[]         // фото наличных
  status      IncassationStatus @default(COLLECTED)
  description String?
  eventTime   DateTime         // время сбора
  handoverTime DateTime?       // время передачи менеджеру
  inputTime   DateTime         @default(now())
  createdAt   DateTime         @default(now())
  
  machine     Machine          @relation(fields: [machineId], references: [id])
  operator    User             @relation("IncassationOperator", fields: [operatorId], references: [id])
  manager     User?            @relation("IncassationManager", fields: [managerId], references: [id])
}

// Поставщики
model Supplier {
  id          String    @id @default(cuid())
  name        String
  type        String    // ингредиенты, расходники, запчасти
  contactInfo Json?     // телефон, email, адрес
  paymentTerms String?  // условия оплаты
  currency    String    @default("UZS")
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  expenses    Expense[]
}
```

### 2.2 Система сверки
```prisma
// Сверка продаж и платежей
model SalesReconciliation {
  id               String                    @id @default(cuid())
  machineId        String
  date             DateTime                  // дата сверки
  salesFromMachine Float                     // продажи по логам автомата
  cashCollected    Float                     // собрано наличными
  qrPayments       Float                     // QR платежи
  vipSales         Float                     // VIP продажи
  testSales        Float                     // тестовые продажи
  totalRevenue     Float                     // общая выручка
  discrepancy      Float                     // расхождение
  status           ReconciliationStatus      @default(PENDING)
  notes            String?                   // комментарии
  createdById      String
  createdAt        DateTime                  @default(now())
  
  machine          Machine                   @relation(fields: [machineId], references: [id])
  createdBy        User                      @relation(fields: [createdById], references: [id])
}

// Сверка ингредиентов
model IngredientReconciliation {
  id                 String                 @id @default(cuid())
  machineId          String
  itemId             String
  date               DateTime
  normativeConsumption Float                // нормативный расход по рецептам
  actualConsumption  Float                 // фактический расход
  discrepancy        Float                 // расхождение
  discrepancyPercent Float                 // расхождение в %
  status             ReconciliationStatus   @default(PENDING)
  notes              String?
  createdById        String
  createdAt          DateTime               @default(now())
  
  machine            Machine                @relation(fields: [machineId], references: [id])
  item               InventoryItem          @relation(fields: [itemId], references: [id])
  createdBy          User                   @relation(fields: [createdById], references: [id])
}
```

---

## ЭТАП 3: Система рецептов и себестоимости (1-2 недели)

### 3.1 Расширение системы рецептов
```prisma
// Дополнить существующую модель Recipe
model Recipe {
  // ... существующие поля
  machineTypes   String[]           // типы автоматов
  costPerUnit    Float?             // себестоимость за единицу
  sellingPrice   Float?             // цена продажи
  margin         Float?             // маржа
  isActive       Boolean            @default(true)
  
  // Новые связи
  reconciliations IngredientReconciliation[]
}

// Партии ингредиентов для учета сроков годности
model IngredientBatch {
  id             String        @id @default(cuid())
  itemId         String
  batchNumber    String
  productionDate DateTime?
  expiryDate     DateTime?
  quantity       Float
  purchasePrice  Float?
  supplierId     String?
  status         BatchStatus   @default(ACTIVE)
  createdAt      DateTime      @default(now())
  
  item           InventoryItem @relation(fields: [itemId], references: [id])
  supplier       Supplier?     @relation(fields: [supplierId], references: [id])
  
  @@unique([itemId, batchNumber])
}
```

---

## ЭТАП 4: Система задач и чек-листов (2-3 недели)

### 4.1 Расширение системы задач
```prisma
// Дополнить существующую модель Task
model Task {
  // ... существующие поля
  category       TaskCategory       @default(MAINTENANCE)
  checklistId    String?
  bagId          String?
  routeId        String?
  estimatedDuration Int?            // ожидаемая длительность в минутах
  actualDuration Int?              // фактическая длительность
  photosRequired Boolean            @default(false)
  gpsRequired    Boolean            @default(false)
  
  // Новые связи
  checklist      TaskChecklist?     @relation(fields: [checklistId], references: [id])
  bag            Bag?               @relation(fields: [bagId], references: [id])
  route          Route?             @relation(fields: [routeId], references: [id])
  checklistItems TaskChecklistItem[]
  taskObjects    TaskObject[]       // связанные объекты (бункеры, вода, сиропы)
}

// Шаблоны чек-листов
model TaskChecklist {
  id          String              @id @default(cuid())
  name        String
  category    TaskCategory
  description String?
  isTemplate  Boolean             @default(true)
  steps       TaskChecklistStep[]
  tasks       Task[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

// Шаги чек-листа
model TaskChecklistStep {
  id            String              @id @default(cuid())
  checklistId   String
  order         Int
  title         String
  description   String?
  isRequired    Boolean             @default(true)
  requiresPhoto Boolean             @default(false)
  requiresWeight Boolean            @default(false)
  requiresInput Boolean             @default(false)
  inputType     ChecklistInputType? // text, number, choice
  inputOptions  String[]            // варианты выбора
  
  checklist     TaskChecklist       @relation(fields: [checklistId], references: [id])
  items         TaskChecklistItem[]
  
  @@unique([checklistId, order])
}

// Выполненные пункты чек-листа
model TaskChecklistItem {
  id          String                  @id @default(cuid())
  taskId      String
  stepId      String
  status      ChecklistItemStatus     @default(PENDING)
  value       String?                 // введенное значение
  weight      Float?                  // вес
  photos      String[]                // фото
  notes       String?                 // комментарии
  skippedReason String?               // причина пропуска
  completedAt DateTime?
  
  task        Task                    @relation(fields: [taskId], references: [id])
  step        TaskChecklistStep       @relation(fields: [stepId], references: [id])
  
  @@unique([taskId, stepId])
}

// Объекты, связанные с задачей
model TaskObject {
  id         String           @id @default(cuid())
  taskId     String
  objectType TaskObjectType
  objectId   String           // ID объекта (bunker, water bottle, etc.)
  action     String?          // действие с объектом
  status     TaskObjectStatus @default(PENDING)
  notes      String?
  
  task       Task             @relation(fields: [taskId], references: [id])
  
  @@index([taskId, objectType])
}
```

---

## ЭТАП 5: Telegram FSM-бот (3-4 недели)

### 5.1 FSM состояния и сценарии
```javascript
// backend/src/telegram/states.js
const FSM_STATES = {
  // Общие состояния
  IDLE: 'idle',
  MAIN_MENU: 'main_menu',
  
  // Состояния оператора
  OPERATOR_TASKS: 'operator_tasks',
  OPERATOR_TASK_DETAIL: 'operator_task_detail',
  OPERATOR_CHECKLIST: 'operator_checklist',
  OPERATOR_PHOTO_UPLOAD: 'operator_photo_upload',
  OPERATOR_WEIGHT_INPUT: 'operator_weight_input',
  OPERATOR_RETURN_BAGS: 'operator_return_bags',
  OPERATOR_INCASSATION: 'operator_incassation',
  
  // Состояния склада
  WAREHOUSE_TASKS: 'warehouse_tasks',
  WAREHOUSE_BAG_CREATION: 'warehouse_bag_creation',
  WAREHOUSE_BAG_CONTENT: 'warehouse_bag_content',
  WAREHOUSE_RECEIVE_RETURN: 'warehouse_receive_return',
  WAREHOUSE_INVENTORY: 'warehouse_inventory',
  
  // Состояния менеджера
  MANAGER_TASKS: 'manager_tasks',
  MANAGER_CREATE_TASK: 'manager_create_task',
  MANAGER_REPORTS: 'manager_reports',
  MANAGER_DIRECTORIES: 'manager_directories',
};

// Роутинг по ролям
const ROLE_MENUS = {
  OPERATOR: [
    { text: '📅 Мои задачи', callback: 'operator_tasks' },
    { text: '🎒 Возврат сумок', callback: 'operator_return_bags' },
    { text: '💰 Инкассация', callback: 'operator_incassation' },
    { text: '📊 Мой отчет', callback: 'operator_report' }
  ],
  WAREHOUSE: [
    { text: '📦 Приём/выдача', callback: 'warehouse_receive' },
    { text: '🎒 Сумки', callback: 'warehouse_bags' },
    { text: '📋 Остатки', callback: 'warehouse_inventory' },
    { text: '🧹 Мойка бункеров', callback: 'warehouse_cleaning' }
  ],
  MANAGER: [
    { text: '📝 Создать задачу', callback: 'manager_create_task' },
    { text: '📋 Задачи', callback: 'manager_tasks' },
    { text: '📊 Отчёты', callback: 'manager_reports' },
    { text: '📚 Справочники', callback: 'manager_directories' }
  ]
};
```

### 5.2 Основные FSM сценарии
```javascript
// Сценарий выполнения задачи оператором
class OperatorTaskExecution {
  async startTask(ctx, taskId) {
    const task = await this.getTaskWithChecklist(taskId);
    ctx.session.currentTask = task;
    ctx.session.currentStepIndex = 0;
    
    await this.showTaskOverview(ctx, task);
    await this.startChecklist(ctx);
  }
  
  async startChecklist(ctx) {
    const { currentTask, currentStepIndex } = ctx.session;
    const step = currentTask.checklist.steps[currentStepIndex];
    
    if (!step) {
      return await this.completeTask(ctx);
    }
    
    await this.showChecklistStep(ctx, step);
  }
  
  async showChecklistStep(ctx, step) {
    let message = `📋 ${step.title}\n`;
    if (step.description) {
      message += `${step.description}\n\n`;
    }
    
    const keyboard = [];
    
    if (step.requiresPhoto) {
      keyboard.push([{ text: '📸 Загрузить фото', callback_data: 'upload_photo' }]);
    }
    
    if (step.requiresWeight) {
      keyboard.push([{ text: '⚖️ Ввести вес', callback_data: 'input_weight' }]);
    }
    
    keyboard.push([
      { text: '✅ Выполнено', callback_data: 'step_complete' },
      { text: '⏭️ Пропустить', callback_data: 'step_skip' }
    ]);
    
    await ctx.editMessageText(message, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }
}

// Сценарий создания сумки на складе
class WarehouseBagCreation {
  async startBagCreation(ctx, taskId) {
    const task = await this.getTaskWithObjects(taskId);
    ctx.session.currentTask = task;
    ctx.session.bagContents = [];
    
    await this.showAvailableBunkers(ctx);
  }
  
  async showAvailableBunkers(ctx) {
    const bunkers = await this.getAvailableBunkers();
    const keyboard = bunkers.map(bunker => [{
      text: `${bunker.name} (${bunker.item.name})`,
      callback_data: `select_bunker_${bunker.id}`
    }]);
    
    keyboard.push([{ text: '✅ Завершить сборку', callback_data: 'complete_bag' }]);
    
    await ctx.editMessageText('🎒 Выберите бункеры для сумки:', {
      reply_markup: { inline_keyboard: keyboard }
    });
  }
}
```

---

## ЭТАП 6: Web-интерфейс расширения (2-3 недели)

### 6.1 Дополнительные страницы и компоненты
```javascript
// frontend/src/pages/Directories/index.jsx
const DirectoriesPage = () => {
  const directories = [
    { name: 'Автоматы', path: '/directories/machines', icon: '🏪' },
    { name: 'Ингредиенты', path: '/directories/ingredients', icon: '🧪' },
    { name: 'Бункеры', path: '/directories/bunkers', icon: '📦' },
    { name: 'Сиропы', path: '/directories/syrups', icon: '🧴' },
    { name: 'Вода', path: '/directories/water', icon: '💧' },
    { name: 'Сумки', path: '/directories/bags', icon: '🎒' },
    { name: 'Рецепты', path: '/directories/recipes', icon: '📝' },
    { name: 'Поставщики', path: '/directories/suppliers', icon: '🏢' }
  ];
  
  return (
    <div className="directories-page">
      <h1>Справочники</h1>
      <div className="directories-grid">
        {directories.map(dir => (
          <DirectoryCard key={dir.path} {...dir} />
        ))}
      </div>
    </div>
  );
};

// frontend/src/pages/Finance/index.jsx
const FinancePage = () => {
  return (
    <div className="finance-page">
      <Tabs>
        <TabPanel label="Доходы">
          <RevenueTable />
        </TabPanel>
        <TabPanel label="Расходы">
          <ExpenseTable />
        </TabPanel>
        <TabPanel label="Инкассация">
          <IncassationTable />
        </TabPanel>
        <TabPanel label="Сверка">
          <ReconciliationTable />
        </TabPanel>
      </Tabs>
    </div>
  );
};
```

### 6.2 Компоненты для работы с чек-листами
```javascript
// frontend/src/components/Tasks/ChecklistEditor.jsx
const ChecklistEditor = ({ checklist, onSave }) => {
  const [steps, setSteps] = useState(checklist?.steps || []);
  
  const addStep = () => {
    setSteps([...steps, {
      title: '',
      description: '',
      isRequired: true,
      requiresPhoto: false,
      requiresWeight: false,
      order: steps.length + 1
    }]);
  };
  
  return (
    <div className="checklist-editor">
      <h3>Редактор чек-листа</h3>
      {steps.map((step, index) => (
        <ChecklistStepEditor 
          key={index}
          step={step}
          onChange={(updatedStep) => updateStep(index, updatedStep)}
          onDelete={() => deleteStep(index)}
        />
      ))}
      <button onClick={addStep}>+ Добавить шаг</button>
      <button onClick={() => onSave(steps)}>Сохранить</button>
    </div>
  );
};
```

---

## ЭТАП 7: Отчеты и аналитика (2-3 недели)

### 7.1 Система отчетов
```javascript
// backend/src/services/reports.service.js
class ReportsService {
  async generateSalesReport(filters) {
    const revenues = await prisma.revenue.findMany({
      where: {
        eventTime: {
          gte: filters.startDate,
          lte: filters.endDate
        },
        machineId: filters.machineId || undefined
      },
      include: { machine: true, user: true }
    });
    
    return this.formatSalesReport(revenues);
  }
  
  async generateReconciliationReport(machineId, date) {
    // Получаем данные о продажах
    const revenues = await this.getSalesData(machineId, date);
    
    // Получаем данные об инкассации
    const incassations = await this.getIncassationData(machineId, date);
    
    // Получаем данные о расходе ингредиентов
    const consumption = await this.getIngredientConsumption(machineId, date);
    
    return this.compareAndAnalyze(revenues, incassations, consumption);
  }
  
  async generateInventoryReport(filters) {
    const movements = await prisma.stockMovement.findMany({
      where: filters,
      include: { item: true, machine: true, user: true }
    });
    
    return this.formatInventoryReport(movements);
  }
}
```

### 7.2 Система сверки и обнаружения аномалий
```javascript
// backend/src/services/reconciliation.service.js
class ReconciliationService {
  async performDailyReconciliation(machineId, date) {
    const salesData = await this.getSalesFromMachineLog(machineId, date);
    const paymentData = await this.getPaymentData(machineId, date);
    const ingredientData = await this.getIngredientConsumption(machineId, date);
    
    const discrepancies = this.findDiscrepancies(
      salesData, 
      paymentData, 
      ingredientData
    );
    
    if (discrepancies.length > 0) {
      await this.createReconciliationRecord(machineId, date, discrepancies);
      await this.notifyManagers(discrepancies);
    }
    
    return discrepancies;
  }
  
  findDiscrepancies(sales, payments, ingredients) {
    const discrepancies = [];
    
    // Сверка продаж и платежей
    const salesTotal = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    if (Math.abs(salesTotal - paymentsTotal) > 1000) { // порог в 1000 сум
      discrepancies.push({
        type: 'PAYMENT_MISMATCH',
        salesTotal,
        paymentsTotal,
        difference: salesTotal - paymentsTotal
      });
    }
    
    // Сверка расхода ингредиентов
    ingredients.forEach(ingredient => {
      const normative = this.calculateNormativeConsumption(ingredient, sales);
      const actual = ingredient.actualConsumption;
      const deviation = Math.abs(normative - actual) / normative * 100;
      
      if (deviation > 10) { // отклонение больше 10%
        discrepancies.push({
          type: 'INGREDIENT_DEVIATION',
          ingredient: ingredient.name,
          normative,
          actual,
          deviation: deviation.toFixed(2) + '%'
        });
      }
    });
    
    return discrepancies;
  }
}
```

---

## ЭТАП 8: Интеграции и API (1-2 недели)

### 8.1 Интеграция с платежными системами
```javascript
// backend/src/services/payment-integration.service.js
class PaymentIntegrationService {
  async syncPaymeTransactions(machineId, date) {
    // Интеграция с Payme API
    const transactions = await this.paymeApi.getTransactions(machineId, date);
    
    for (const transaction of transactions) {
      await prisma.revenue.upsert({
        where: { externalId: transaction.id },
        create: {
          amount: transaction.amount,
          source: 'QR_PAYME',
          paymentType: 'QR',
          machineId,
          externalId: transaction.id,
          eventTime: new Date(transaction.timestamp),
          fiscalized: transaction.fiscalized
        },
        update: {
          amount: transaction.amount,
          fiscalized: transaction.fiscalized
        }
      });
    }
  }
  
  async syncClickTransactions(machineId, date) {
    // Аналогично для Click
  }
  
  async syncUzumTransactions(machineId, date) {
    // Аналогично для Uzum
  }
}
```

### 8.2 API для мобильного приложения
```javascript
// backend/src/routes/mobile-api.routes.js
router.get('/tasks/my', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  
  const tasks = await tasksService.getUserTasks(userId, userRole);
  res.json(tasks);
});

router.post('/tasks/:id/checklist/:stepId', authenticateJWT, async (req, res) => {
  const { id: taskId, stepId } = req.params;
  const { status, value, weight, photos, notes } = req.body;
  
  const result = await tasksService.updateChecklistItem(
    taskId, 
    stepId, 
    {
      status,
      value,
      weight,
      photos,
      notes,
      completedAt: status === 'COMPLETED' ? new Date() : null
    }
  );
  
  res.json(result);
});
```

---

## ЭТАП 9: Тестирование и отладка (2-3 недели)

### 9.1 Unit тесты
```javascript
// backend/tests/services/tasks.service.test.js
describe('TasksService', () => {
  let service;
  
  beforeEach(() => {
    service = new TasksService();
  });
  
  describe('createTaskWithChecklist', () => {
    it('should create task with default checklist for maintenance category', async () => {
      const taskData = {
        title: 'Плановое ТО',
        category: 'MAINTENANCE',
        machineId: 'machine-1',
        assignedTo: 'user-1'
      };
      
      const task = await service.createTaskWithChecklist(taskData);
      
      expect(task.checklist).toBeDefined();
      expect(task.checklist.steps.length).toBeGreaterThan(0);
    });
  });
});
```

### 9.2 Интеграционные тесты
```javascript
// backend/tests/integration/telegram-bot.test.js
describe('Telegram Bot Integration', () => {
  let bot;
  
  beforeEach(() => {
    bot = new MockBot();
  });
  
  it('should handle operator task selection', async () => {
    const user = await createTestUser({ role: 'OPERATOR' });
    const task = await createTestTask({ assignedTo: user.id });
    
    await bot.sendUpdate({
      message: { text: '/start', from: { id: user.telegramId } }
    });
    
    await bot.sendUpdate({
      callback_query: { 
        data: 'operator_tasks', 
        from: { id: user.telegramId } 
      }
    });
    
    const lastMessage = bot.getLastMessage();
    expect(lastMessage.text).toContain(task.title);
  });
});
```

---

## ЭТАП 10: Развертывание и мониторинг (1-2 недели)

### 10.1 Docker конфигурация для новых сервисов
```dockerfile
# Обновить Dockerfile для поддержки новой функциональности
FROM node:18-alpine

WORKDIR /app

# Добавить переменные окружения для новых интеграций
ENV PAYME_API_URL=""
ENV CLICK_API_URL=""
ENV UZUM_API_URL=""
ENV TELEGRAM_WEBHOOK_URL=""

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 10.2 Мониторинг и логирование
```javascript
// backend/src/monitoring/metrics.js
const prometheus = require('prom-client');

const taskMetrics = {
  totalTasks: new prometheus.Counter({
    name: 'vhm_tasks_total',
    help: 'Total number of tasks created',
    labelNames: ['category', 'status']
  }),
  
  taskDuration: new prometheus.Histogram({
    name: 'vhm_task_duration_seconds',
    help: 'Task completion duration',
    labelNames: ['category']
  }),
  
  reconciliationDiscrepancies: new prometheus.Counter({
    name: 'vhm_reconciliation_discrepancies_total',
    help: 'Number of reconciliation discrepancies found',
    labelNames: ['type', 'machine_id']
  })
};

module.exports = taskMetrics;
```

---

## Временной план внедрения

| Этап | Описание | Длительность | Ответственный |
|------|----------|--------------|---------------|
| 1 | Расширение модели данных | 1-2 недели | Backend разработчик |
| 2 | Финансовый модуль | 2-3 недели | Backend + Frontend |
| 3 | Система рецептов | 1-2 недели | Backend разработчик |
| 4 | Задачи и чек-листы | 2-3 недели | Fullstack |
| 5 | Telegram FSM-бот | 3-4 недели | Backend + Telegram |
| 6 | Web-интерфейс | 2-3 недели | Frontend разработчик |
| 7 | Отчеты и аналитика | 2-3 недели | Fullstack |
| 8 | Интеграции и API | 1-2 недели | Backend разработчик |
| 9 | Тестирование | 2-3 недели | QA + Dev |
| 10 | Развертывание | 1-2 недели | DevOps |

**Общее время: 15-25 недель (4-6 месяцев)**

---

## Риски и митигация

### Основные риски:
1. **Совместимость с существующим кодом** - тщательное тестирование миграций
2. **Сложность FSM логики в Telegram** - поэтапная разработка и тестирование
3. **Производительность при больших объемах данных** - индексация БД и оптимизация запросов
4. **Интеграция с внешними API** - обработка ошибок и fallback сценарии

### План митигации:
- Еженедельные ретроспективы команды
- Continuous Integration/Deployment
- Детальное логирование и мониторинг
- Backup стратегия для критических данных

---

## Критерии готовности

### Этап считается завершенным, когда:
- ✅ Все unit тесты проходят
- ✅ Интеграционные тесты покрывают основные сценарии
- ✅ Проведен code review
- ✅ Обновлена документация
- ✅ Deployment протестирован на staging окружении

### Готовность к production:
- ✅ Все этапы завершены
- ✅ Load testing показывает приемлемую производительность
- ✅ Security audit пройден
- ✅ Rollback план подготовлен
- ✅ Команда поддержки обучена
