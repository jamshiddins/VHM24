# 📊 Анализ соответствия VHM24 требованиям вендинговой системы

## 🔍 Сравнительный анализ

### 1. Вендинговые автоматы ✅/❌

**Требования:**
- model ✅ (есть в Machine)
- serial_number ✅ (serialNumber в Machine)
- vendhub_code ❌ (нужно добавить внутренний код)
- location ✅ (есть location и coordinates)
- status ✅ (есть, но нужно расширить статусы)
- group ❌ (нет группировки по районам)
- installation_date ❌ (нужно добавить)
- assigned_operator_id ❌ (нет привязки к оператору)

**Необходимые доработки:**
```javascript
// Добавить в Machine модель:
vendHubCode: String // VM-015-TASH-WEST
groupId: String // район/группа
installationDate: Date
assignedOperatorId: String // ID оператора
```

### 2. Бункеры ❌ (ОТСУТСТВУЕТ)

**Требуется создать новую модель:**
```javascript
// Bunker model
{
  code: String, // SET-005-4SU
  setNumber: String, // SET-005
  position: Number, // 4
  ingredientCode: String, // SU
  ingredientType: Enum, // 8 типов
  emptyWeight: Number,
  fillWeight: Number,
  returnWeight: Number,
  status: Enum, // на складе/в машине/в пути/на мойке/повреждён
  currentMachineId: String,
  history: [{
    action: String, // заполнение/установка/возврат
    timestamp: Date,
    performedBy: String,
    weight: Number,
    location: String
  }]
}
```

### 3. Сиропы ✅/❌

**Текущее:** Частично есть в Inventory
**Необходимо:**
- Создать отдельную категорию для сиропов
- Добавить volume_liters вместо quantity
- Добавить привязку к машине
- Добавить статус (полный/частично использован/пустой)

### 4. Вода ❌ (ОТСУТСТВУЕТ)

**Требуется создать модель:**
```javascript
// WaterBottle model
{
  bottleId: String,
  volumeLiters: 18.9,
  arrivalDate: Date,
  machineId: String,
  status: Enum, // full/empty/in_use
  returnedEmpty: Boolean,
  operatorId: String
}
```

### 5. Запасные части ✅/❌

**Текущее:** Частично есть в Inventory
**Необходимо:**
- Добавить уникальный код SP-2024-DC24-5V-001
- Добавить compatible_with для совместимости
- Добавить историю использования в машинах

### 6. Поставщики и контракты ❌ (ОТСУТСТВУЕТ)

**Требуется создать модели:**
```javascript
// Supplier model
{
  name: String,
  inn: String,
  contactPerson: String,
  currency: String,
  paymentTerms: String,
  contracts: [Contract]
}

// Contract model
{
  contractNumber: String,
  supplierId: String,
  signedDate: Date,
  expirationDate: Date,
  items: [{
    itemId: String,
    quantity: Number,
    price: Number
  }],
  paymentConditions: String
}
```

### 7. Учет партий товаров ❌ (ОТСУТСТВУЕТ)

**Требуется создать модель:**
```javascript
// Batch model
{
  code: String, // PARTY-2024-CHOC-03
  type: String,
  ingredientOrItem: String,
  quantity: Number,
  expirationDate: Date,
  usedIn: [{
    machineId: String,
    date: Date,
    quantity: Number
  }],
  remaining: Number,
  status: String
}
```

### 8. Финансовый учет ❌ (ОТСУТСТВУЕТ)

**Требуется создать сервис Financial:**
```javascript
// Income model
{
  source: Enum, // QR/cash/VIP/rent
  amount: Decimal,
  machineId: String,
  timestamp: Date,
  paymentGateway: String
}

// Expense model
{
  category: Enum, // ingredients/rent/repair/etc
  amount: Decimal,
  recipient: String,
  paymentType: Enum, // cash/invoice/bank
  invoiceNumber: String,
  linkedSupplier: String,
  linkedContract: String
}
```

### 9. Рецепты и себестоимость ❌ (ОТСУТСТВУЕТ)

**Требуется создать модель:**
```javascript
// Recipe model
{
  name: String,
  version: String,
  ingredients: [{
    ingredientId: String,
    gramms: Number
  }],
  syrups: [{
    syrupId: String,
    ml: Number
  }],
  waterVolume: Number,
  costPerUnit: Decimal, // рассчитывается автоматически
  history: [Version]
}
```

### 10. Исторические данные ✅/❌

**Текущее:** Есть AuditLog
**Необходимо доработать:**
- Добавить performed_at (фактическое время события)
- Добавить entered_at (время записи)
- Добавить method (ручной/telegram/автоимпорт)
- Добавить media[] для фото

### 11. Telegram интерфейс ✅/❌

**Текущее:** Базовый интерфейс создан
**Необходимо доработать:**
- FSM для сложных операций
- Ролевая модель (склад/оператор/менеджер/админ)
- Взвешивание бункеров
- Фотофиксация
- Геометки
- Ввод данных задним числом

## 📋 План доработки VHM24

### Фаза 1: Расширение моделей данных (1 неделя)
1. Доработать Machine модель
2. Создать Bunker модель и сервис
3. Создать WaterBottle модель
4. Расширить Inventory для сиропов и запчастей

### Фаза 2: Финансовый модуль (1 неделя)
1. Создать Financial сервис
2. Модели Income и Expense
3. Интеграция с платежными системами
4. Отчетность

### Фаза 3: Поставщики и партии (5 дней)
1. Создать Supplier сервис
2. Модели Supplier, Contract, Batch
3. Tracking партий товаров

### Фаза 4: Рецепты и себестоимость (3 дня)
1. Создать Recipe сервис
2. Автоматический расчет себестоимости
3. Версионирование рецептов

### Фаза 5: Доработка Telegram Bot (1 неделя)
1. Реализовать FSM для сложных операций
2. Добавить ролевую модель
3. Интерфейс взвешивания
4. Фотофиксация через MinIO
5. Ввод исторических данных

## 🔧 Приоритетные доработки

### 1. Создать новый сервис Bunkers:
```bash
services/bunkers/
├── src/
│   ├── index.js
│   ├── models/
│   ├── routes/
│   └── services/
```

### 2. Создать Financial сервис:
```bash
services/financial/
├── src/
│   ├── index.js
│   ├── models/
│   ├── routes/
│   └── reports/
```

### 3. Расширить Telegram Bot:
- Добавить handlers/bunkerHandler.js
- Добавить handlers/financialHandler.js
- Добавить utils/fsm.js для состояний
- Добавить utils/photoUploader.js

## 📊 Матрица соответствия

| Функционал | VHM24 | Требования | Статус |
|------------|-------|------------|--------|
| Вендинговые автоматы | ✅ | ✅✅✅ | 60% |
| Бункеры | ❌ | ✅✅✅ | 0% |
| Сиропы | ✅ | ✅✅✅ | 40% |
| Вода | ❌ | ✅✅✅ | 0% |
| Запчасти | ✅ | ✅✅✅ | 50% |
| Поставщики | ❌ | ✅✅✅ | 0% |
| Партии товаров | ❌ | ✅✅✅ | 0% |
| Финансы | ❌ | ✅✅✅ | 0% |
| Рецепты | ❌ | ✅✅✅ | 0% |
| История | ✅ | ✅✅✅ | 70% |
| Telegram | ✅ | ✅✅✅ | 50% |

**Общее соответствие: ~35%**

## 💡 Рекомендации

1. **Приоритет 1:** Создать модели для бункеров и финансов
2. **Приоритет 2:** Доработать Telegram Bot под специфику
3. **Приоритет 3:** Реализовать поставщиков и партии
4. **Приоритет 4:** Добавить рецепты и себестоимость

Для полного соответствия требованиям необходимо около 4-5 недель разработки.
