const fs = require('fs');
const path = require('path');



const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');

// Читаем текущую схему;
let schema = fs.readFileSync(schemaPath, 'utf8');

// Исправляем ошибки;

// Добавляем недостающие связи в модель Machine;
schema = schema.replace(;
  /model Machine \{[\s\S]*?\}/,;
  `model Machine {
  id          String   @id @default(cuid());
  name        String;
  model       String?;
  serialNumber String?;
  type        MachineType @default(COFFEE);
  status      MachineStatus @default(ACTIVE);
  locationId  String?;
  simCard     String?;
  electricMeter String?;
  notes       String?;
  createdAt   DateTime @default(now());
  updatedAt   DateTime @updatedAt;
  // Связи;
  location    Location? @relation("fields": [locationId], "references": [id]);
  bags        Bag[];
  tasks       Task[];
  routes      RouteStop[];
  sales       Sale[];
  cashCollections CashCollection[];
  expenses    Expense[];
  incomes     Income[];
  actionLogs  ActionLog[];
  movements   Movement[];
  @@map("machines");
}`;
);


// Добавляем недостающие связи в модель User;
schema = schema.replace(;
  /model User \{[\s\S]*?\}/,;
  `model User {
  id          String   @id @default(cuid());
  telegramId  String   @unique;
  firstName   String;
  lastName    String?;
  username    String?;
  role        UserRole @default(OPERATOR);
  status      UserStatus @default(ACTIVE);
  phone       String?;
  createdAt   DateTime @default(now());
  updatedAt   DateTime @updatedAt;
  // Связи;
  tasks       Task[];
  routes      Route[];
  actionLogs  ActionLog[];
  movements   Movement[];
  hopperMovements HopperMovement[];
  waterMovements WaterMovement[];
  inventoryMovements InventoryMovement[];
  cashCollections CashCollection[];
  expenses    Expense[];
  incomes     Income[];
  @@map("users");
}`;
);


// Исправляем связь в модели Sale - убираем @unique для taskId;
schema = schema.replace(;
  /task\s+Task\?\s+@relation\("fields":\s*\[taskId\],\s*"references":\s*\[id\]\)/,;
  'task      Task?    @relation("fields": [taskId], "references": [id])';
);

// Добавляем связь sales в модель Task;
schema = schema.replace(;
  /model Task \{[\s\S]*?\/\/ Связи[\s\S]*?\}/,;
  `model Task {
  id          String   @id @default(cuid());
  type        TaskType;
  status      TaskStatus @default(CREATED);
  title       String;
  description String?;
  machineId   String;
  assignedTo  String;
  routeId     String?;
  priority    TaskPriority @default(NORMAL);
  dueDate     DateTime?;
  completedAt DateTime?;
  notes       String?;
  createdAt   DateTime @default(now());
  updatedAt   DateTime @updatedAt;
  // Связи;
  machine     Machine  @relation("fields": [machineId], "references": [id]);
  assignee    User     @relation("fields": [assignedTo], "references": [id]);
  route       Route?   @relation("fields": [routeId], "references": [id]);
  sales       Sale[];
  actionLogs  ActionLog[];
  movements   Movement[];
  @@map("tasks");
}`;
);


fs.writeFileSync(schemaPath, schema);



