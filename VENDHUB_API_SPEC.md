# VendHub API Specification

## Базовая структура

### Формат ответов

Все API ответы следуют единому формату:

```json
{
  "success": true,
  "data": {}, // или []
  "error": null,
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid-v4"
  }
}
```

При ошибке:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "meta": {...}
}
```

### Аутентификация

Все запросы должны содержать JWT токен:
```
Authorization: Bearer <jwt-token>
```

### Пагинация

Для списковых эндпоинтов:
```
GET /endpoint?page=1&limit=20&sort=createdAt:desc
```

Ответ содержит meta информацию:
```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

## 1. Machines Service

### GET /api/machines
Получить список автоматов

Query параметры:
- `status`: ACTIVE | WAREHOUSE | BROKEN | MAINTENANCE
- `groupName`: string
- `operatorId`: string
- `search`: поиск по коду или адресу

Ответ:
```json
{
  "data": [
    {
      "id": "cuid",
      "model": "NECTA KREA TOUCH",
      "serialNumber": "NK2024001",
      "vendhubCode": "VM-015-TASH-WEST",
      "status": "ACTIVE",
      "locationAddress": "ул. Амира Темура, 15",
      "locationLat": 41.3123,
      "locationLng": 69.2787,
      "groupName": "Центр",
      "operator": {
        "id": "user-id",
        "name": "Иван Петров"
      },
      "lastServiceDate": "2024-01-10T08:00:00Z",
      "componentsCount": {
        "bunkers": 8,
        "syrups": 2,
        "waterBottles": 2
      }
    }
  ]
}
```

### GET /api/machines/:code
Получить детали автомата

Ответ включает полную информацию с компонентами.

### POST /api/machines
Создать новый автомат

Тело запроса:
```json
{
  "model": "NECTA KREA TOUCH",
  "serialNumber": "NK2024001",
  "vendhubCode": "VM-015-TASH-WEST",
  "locationAddress": "ул. Амира Темура, 15",
  "locationLat": 41.3123,
  "locationLng": 69.2787,
  "groupName": "Центр",
  "operatorId": "user-id"
}
```

### PUT /api/machines/:code
Обновить данные автомата

### POST /api/machines/:code/status
Изменить статус автомата

Тело запроса:
```json
{
  "status": "MAINTENANCE",
  "reason": "Плановое обслуживание"
}
```

### GET /api/machines/:code/components
Получить компоненты автомата

Ответ:
```json
{
  "data": {
    "bunkers": [
      {
        "position": 1,
        "bunker": {
          "code": "SET-005-1CO",
          "ingredientType": "COFFEE",
          "currentFill": {
            "weight": 850,
            "filledAt": "2024-01-10T08:00:00Z",
            "batch": "PARTY-2024-COFF-03"
          }
        }
      }
    ],
    "syrups": [
      {
        "id": "syrup-id",
        "type": "CARAMEL",
        "volumeRemaining": 0.7,
        "expirationDate": "2024-03-01"
      }
    ],
    "waterBottles": [
      {
        "id": "bottle-id",
        "status": "IN_USE",
        "installedAt": "2024-01-10T08:00:00Z"
      }
    ]
  }
}
```

### POST /api/machines/:code/service
Записать обслуживание

Тело запроса:
```json
{
  "serviceType": "CLEANING",
  "description": "Полная чистка и дезинфекция",
  "performedAt": "2024-01-15T10:00:00Z",
  "nextServiceDate": "2024-02-15T10:00:00Z",
  "photos": ["url1", "url2"],
  "location": {
    "lat": 41.3123,
    "lng": 69.2787
  }
}
```

## 2. Bunkers Service

### GET /api/bunkers
Получить список бункеров

Query параметры:
- `status`: WAREHOUSE | IN_MACHINE | IN_TRANSIT | WASHING | DAMAGED
- `ingredientType`: COFFEE | CREAM | CHOCOLATE | SUGAR | MILK | CAPPUCCINO | DECAF | TEA
- `machineCode`: string
- `setCode`: string

### GET /api/bunkers/:code
Получить детали бункера

Ответ:
```json
{
  "data": {
    "id": "bunker-id",
    "code": "SET-005-4SU",
    "setCode": "SET-005",
    "position": 4,
    "ingredientCode": "SU",
    "ingredientType": "SUGAR",
    "emptyWeight": 450,
    "status": "IN_MACHINE",
    "currentMachine": {
      "code": "VM-015-TASH-WEST",
      "address": "ул. Амира Темура, 15"
    },
    "currentFill": {
      "weight": 850,
      "netWeight": 400,
      "filledAt": "2024-01-10T08:00:00Z",
      "batch": {
        "code": "PARTY-2024-SUG-05",
        "expirationDate": "2025-01-10"
      }
    },
    "lastOperations": [...]
  }
}
```

### POST /api/bunkers/:code/fill
Заполнить бункер

Тело запроса:
```json
{
  "emptyWeight": 450,
  "fullWeight": 1250,
  "batchCode": "PARTY-2024-SUG-05",
  "performedAt": "2024-01-15T09:00:00Z",
  "photos": ["url1", "url2"],
  "comments": "Заполнен полностью"
}
```

### POST /api/bunkers/:code/install
Установить в автомат

Тело запроса:
```json
{
  "machineCode": "VM-015-TASH-WEST",
  "position": 4,
  "performedAt": "2024-01-15T10:00:00Z",
  "location": {
    "lat": 41.3123,
    "lng": 69.2787
  }
}
```

### POST /api/bunkers/:code/remove
Снять из автомата

Тело запроса:
```json
{
  "returnWeight": 650,
  "wasteWeight": 50,
  "performedAt": "2024-01-20T10:00:00Z",
  "reason": "Плановая замена",
  "photos": ["url1"]
}
```

### POST /api/bunkers/:code/wash
Отправить на мойку

### POST /api/bunkers/batch-operation
Массовая операция с бункерами

Тело запроса:
```json
{
  "operation": "FILL",
  "bunkers": [
    {
      "code": "SET-005-1CO",
      "emptyWeight": 450,
      "fullWeight": 1450
    },
    {
      "code": "SET-005-2CR",
      "emptyWeight": 430,
      "fullWeight": 1230
    }
  ],
  "batchCode": "PARTY-2024-MIX-01",
  "performedAt": "2024-01-15T09:00:00Z"
}
```

## 3. Inventory Service

### GET /api/batches
Получить список партий

Query параметры:
- `type`: INGREDIENT | SYRUP | SPARE_PART
- `status`: ACTIVE | USED | EXPIRED
- `supplierId`: string
- `expiringDays`: число дней до истечения

### POST /api/batches
Создать новую партию

Тело запроса:
```json
{
  "code": "PARTY-2024-COFF-10",
  "type": "INGREDIENT",
  "ingredientId": "ingredient-id",
  "supplierId": "supplier-id",
  "contractId": "contract-id",
  "quantity": 50,
  "unit": "kg",
  "costPerUnit": 120000,
  "arrivalDate": "2024-01-15",
  "expirationDate": "2025-01-15",
  "storageLocation": "Склад 1, Стеллаж А-3"
}
```

### GET /api/stock/current
Текущие остатки на складе

Ответ:
```json
{
  "data": {
    "ingredients": [
      {
        "ingredient": {
          "id": "ing-1",
          "name": "Кофе Arabica",
          "type": "COFFEE"
        },
        "totalQuantity": 125.5,
        "unit": "kg",
        "batches": [
          {
            "code": "PARTY-2024-COFF-08",
            "remaining": 45.5,
            "expirationDate": "2024-12-01"
          },
          {
            "code": "PARTY-2024-COFF-10",
            "remaining": 80,
            "expirationDate": "2025-01-15"
          }
        ],
        "avgCostPerUnit": 118000
      }
    ],
    "syrups": [...],
    "spareParts": [...]
  }
}
```

### POST /api/stock/movement
Движение товара

Тело запроса:
```json
{
  "batchCode": "PARTY-2024-COFF-10",
  "movementType": "ISSUE",
  "quantity": 5,
  "fromLocation": "Склад 1",
  "toLocation": "Оператор Петров",
  "reason": "Выдача для заполнения бункеров",
  "reference": "REQ-2024-0150",
  "performedAt": "2024-01-15T08:00:00Z"
}
```

### GET /api/stock/expiring
Товары с истекающим сроком

Query параметры:
- `days`: количество дней (по умолчанию 30)

## 4. Finance Service

### POST /api/revenue
Записать доход

Тело запроса:
```json
{
  "machineCode": "VM-015-TASH-WEST",
  "source": "QR",
  "amount": 450000,
  "currency": "UZS",
  "paymentGateway": "Payme",
  "reference": "PME2024011500123",
  "collectedAt": "2024-01-15T18:00:00Z"
}
```

### POST /api/expenses
Записать расход

Тело запроса:
```json
{
  "category": "INGREDIENTS",
  "amount": 6000000,
  "currency": "UZS",
  "paymentType": "BANK_ACCOUNT",
  "supplierId": "supplier-id",
  "invoiceNumber": "INV-2024-0089",
  "description": "Закупка кофе и сливок",
  "performedAt": "2024-01-15",
  "attachments": ["invoice-url"]
}
```

### GET /api/transactions
Получить транзакции

Query параметры:
- `type`: INCOME | EXPENSE
- `category`: для расходов
- `source`: для доходов
- `dateFrom`: YYYY-MM-DD
- `dateTo`: YYYY-MM-DD
- `machineCode`: string

### GET /api/reports/pnl
Отчет о прибылях и убытках

Query параметры:
- `period`: day | week | month | year | custom
- `dateFrom`: для custom периода
- `dateTo`: для custom периода
- `groupBy`: machine | location | category

Ответ:
```json
{
  "data": {
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "summary": {
      "totalRevenue": 45000000,
      "totalExpenses": 28000000,
      "netProfit": 17000000,
      "profitMargin": 37.78
    },
    "revenue": {
      "bySource": {
        "QR": 35000000,
        "CASH": 8000000,
        "VIP": 2000000
      },
      "byMachine": [...]
    },
    "expenses": {
      "byCategory": {
        "INGREDIENTS": 15000000,
        "RENT": 5000000,
        "SALARY": 4000000,
        "TRANSPORT": 2000000,
        "UTILITIES": 1500000,
        "REPAIR": 500000
      }
    },
    "daily": [...]
  }
}
```

### GET /api/reports/cashflow
Движение денежных средств

## 5. Recipes Service

### GET /api/recipes
Получить список рецептов

Query параметры:
- `category`: string
- `isActive`: boolean
- `machineCode`: рецепты конкретного автомата

### GET /api/recipes/:id
Получить детали рецепта

Ответ:
```json
{
  "data": {
    "id": "recipe-id",
    "name": "Капучино с карамелью",
    "category": "Кофе",
    "isActive": true,
    "currentVersion": {
      "version": 3,
      "waterVolume": 150,
      "temperature": 92,
      "pressure": 9,
      "ingredients": [
        {
          "ingredient": {
            "name": "Кофе Arabica",
            "type": "COFFEE"
          },
          "quantity": 7.5
        },
        {
          "ingredient": {
            "name": "Сухие сливки",
            "type": "CREAM"
          },
          "quantity": 3.0
        }
      ],
      "syrups": [
        {
          "type": "CARAMEL",
          "volumeMl": 20
        }
      ],
      "cost": 3250,
      "createdBy": "Технолог Иванов",
      "createdAt": "2024-01-05"
    },
    "versions": [...]
  }
}
```

### POST /api/recipes
Создать новый рецепт

### POST /api/recipes/:id/versions
Создать новую версию рецепта

Тело запроса:
```json
{
  "waterVolume": 160,
  "temperature": 90,
  "pressure": 9,
  "ingredients": [
    {
      "ingredientId": "ing-1",
      "quantity": 8.0
    },
    {
      "ingredientId": "ing-2",
      "quantity": 2.5
    }
  ],
  "syrups": [
    {
      "syrupType": "CARAMEL",
      "volumeMl": 25
    }
  ]
}
```

### GET /api/recipes/:id/cost-history
История изменения себестоимости

### POST /api/machines/:code/recipes
Назначить рецепты автомату

Тело запроса:
```json
{
  "recipes": [
    {
      "recipeId": "recipe-1",
      "buttonNumber": 1,
      "price": 15000
    },
    {
      "recipeId": "recipe-2",
      "buttonNumber": 2,
      "price": 18000
    }
  ]
}
```

## 6. Suppliers Service

### GET /api/suppliers
Получить список поставщиков

### POST /api/suppliers
Создать поставщика

Тело запроса:
```json
{
  "name": "ООО КофеИмпорт",
  "inn": "123456789",
  "contactPerson": "Сидоров А.В.",
  "phoneNumber": "+998901234567",
  "email": "info@coffeeimport.uz",
  "address": "г. Ташкент, ул. Промышленная, 45",
  "currency": "USD",
  "paymentTerms": "Предоплата 50%, остаток в течение 30 дней"
}
```

### GET /api/contracts
Получить контракты

Query параметры:
- `supplierId`: string
- `isActive`: boolean
- `expiringDays`: число дней

### POST /api/contracts
Создать контракт

Тело запроса:
```json
{
  "contractNumber": "К-2024-015",
  "supplierId": "supplier-id",
  "signedDate": "2024-01-01",
  "expirationDate": "2024-12-31",
  "items": [
    {
      "name": "Кофе Arabica",
      "unit": "kg",
      "pricePerUnit": 12.5,
      "currency": "USD"
    },
    {
      "name": "Сухие сливки",
      "unit": "kg", 
      "pricePerUnit": 8.0,
      "currency": "USD"
    }
  ],
  "paymentConditions": "50% предоплата",
  "deliveryTerms": "DDP Ташкент"
}
```

## 7. Reports Service

### GET /api/reports/machines/status
Состояние автоматов

Ответ:
```json
{
  "data": {
    "summary": {
      "total": 45,
      "active": 38,
      "warehouse": 3,
      "broken": 2,
      "maintenance": 2
    },
    "machines": [
      {
        "code": "VM-015-TASH-WEST",
        "status": "ACTIVE",
        "location": "ул. Амира Темура, 15",
        "lastService": "2024-01-10",
        "nextService": "2024-02-10",
        "alerts": [
          {
            "type": "LOW_INGREDIENT",
            "message": "Низкий уровень кофе (< 20%)",
            "bunkerCode": "SET-005-1CO"
          }
        ]
      }
    ]
  }
}
```

### GET /api/reports/ingredients/consumption
Расход ингредиентов

Query параметры:
- `period`: day | week | month
- `ingredientType`: тип ингредиента
- `machineCode`: конкретный автомат

### GET /api/reports/operators/efficiency
Эффективность операторов

### GET /api/reports/analytics/forecast
Прогноз потребления

## 8. Telegram Bot Webhooks

### POST /api/telegram/webhook
Webhook для Telegram обновлений

### GET /api/telegram/qr/:machineCode
Генерация QR кода для автомата

### POST /api/telegram/photo-upload
Загрузка фото

Multipart form-data:
- `photo`: файл изображения
- `context`: JSON с контекстом (операция, объект)

Ответ:
```json
{
  "data": {
    "url": "https://storage.vendhub.uz/photos/2024/01/15/uuid.jpg",
    "thumbnailUrl": "https://storage.vendhub.uz/photos/2024/01/15/uuid-thumb.jpg"
  }
}
```

## Коды ошибок

- `AUTH_FAILED` - Ошибка аутентификации
- `PERMISSION_DENIED` - Недостаточно прав
- `NOT_FOUND` - Ресурс не найден
- `VALIDATION_ERROR` - Ошибка валидации
- `BUSINESS_LOGIC_ERROR` - Бизнес-логика нарушена
- `CONFLICT` - Конфликт данных
- `EXTERNAL_SERVICE_ERROR` - Ошибка внешнего сервиса

## WebSocket Events

### Подключение
```javascript
ws://api.vendhub.uz/ws?token=<jwt-token>
```

### События:

#### machine.status.changed
```json
{
  "event": "machine.status.changed",
  "data": {
    "machineCode": "VM-015-TASH-WEST",
    "oldStatus": "ACTIVE",
    "newStatus": "MAINTENANCE",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### ingredient.low_level
```json
{
  "event": "ingredient.low_level",
  "data": {
    "machineCode": "VM-015-TASH-WEST",
    "bunkerCode": "SET-005-1CO",
    "ingredientType": "COFFEE",
    "level": 15,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### task.created
#### task.completed
#### revenue.collected
