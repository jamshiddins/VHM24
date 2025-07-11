# Документация по API VHM24

## Обзор

Данная документация описывает API endpoints, доступные для мобильного приложения VHM24. API
построено на принципах REST и использует JSON для передачи данных.

## Базовый URL

```
http://api.vhm24.com/api/v1
```

В разработке:

```
http://localhost:8000/api/v1
```

## Аутентификация

Все запросы (кроме `/auth/login`) должны содержать JWT токен в заголовке `Authorization`:

```
Authorization: Bearer <token>
```

### Получение токена

```
POST /auth/login
```

#### Тело запроса

```json
{
  "telegramId": "123456789",
  // ИЛИ
  "username": "telegram_username"
}
```

#### Ответ

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "name": "Имя Пользователя",
    "roles": ["OPERATOR"],
    "phoneNumber": "+79123456789",
    "telegramUsername": "telegram_username"
  },
  "message": "Welcome to VHM24 - 24/7 Access Granted"
}
```

### Обновление токена

```
POST /auth/refresh
```

#### Тело запроса

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Получение информации о текущем пользователе

```
GET /auth/me
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "email": "user@example.com",
    "name": "Имя Пользователя",
    "roles": ["OPERATOR"],
    "phoneNumber": "+79123456789",
    "isActive": true,
    "createdAt": "2025-07-10T14:00:00.000Z",
    "lastLogin": "2025-07-10T14:00:00.000Z",
    "telegramUsername": "telegram_username"
  }
}
```

## Автоматы

### Получение списка автоматов

```
GET /machines
```

#### Параметры запроса

| Параметр   | Тип     | Описание                                                |
| ---------- | ------- | ------------------------------------------------------- |
| status     | string  | Фильтр по статусу (ONLINE, OFFLINE, MAINTENANCE, ERROR) |
| type       | string  | Фильтр по типу                                          |
| locationId | string  | Фильтр по местоположению                                |
| search     | string  | Поиск по коду, имени или серийному номеру               |
| skip       | integer | Смещение для пагинации (по умолчанию 0)                 |
| take       | integer | Количество записей (по умолчанию 20, максимум 100)      |
| orderBy    | string  | Поле для сортировки (code, name, status, updatedAt)     |

#### Ответ

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "code": "CVM-00001",
        "serialNumber": "SN12345",
        "type": "COFFEE",
        "name": "Кофейный автомат #1",
        "status": "ONLINE",
        "location": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "name": "ТЦ Мега",
          "address": "ул. Примерная, 123"
        },
        "lastTelemetry": {
          "temperature": 25.5,
          "humidity": 45.2,
          "sales": 42,
          "errors": []
        }
      }
    ],
    "total": 42,
    "skip": 0,
    "take": 20
  }
}
```

### Получение информации об автомате

```
GET /machines/:id
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "code": "CVM-00001",
    "serialNumber": "SN12345",
    "type": "COFFEE",
    "name": "Кофейный автомат #1",
    "status": "ONLINE",
    "location": {
      "id": "cjld2cjxh0000qzrmn831i7rn",
      "name": "ТЦ Мега",
      "address": "ул. Примерная, 123",
      "latitude": 55.123456,
      "longitude": 37.123456
    },
    "tasks": [
      {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "title": "Пополнить запасы",
        "status": "ASSIGNED",
        "priority": "HIGH",
        "assignedTo": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "name": "Иван Иванов"
        }
      }
    ],
    "telemetry": [
      {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "temperature": 25.5,
        "humidity": 45.2,
        "sales": 42,
        "errors": [],
        "createdAt": "2025-07-10T14:00:00.000Z"
      }
    ],
    "stats": {
      "totalTasks": 42,
      "activeTasks": 5,
      "completedToday": 3
    }
  }
}
```

### Получение телеметрии автомата

```
GET /machines/:id/telemetry
```

#### Параметры запроса

| Параметр | Тип     | Описание                                             |
| -------- | ------- | ---------------------------------------------------- |
| from     | string  | Начальная дата (ISO 8601)                            |
| to       | string  | Конечная дата (ISO 8601)                             |
| limit    | integer | Количество записей (по умолчанию 100, максимум 1000) |

#### Ответ

```json
{
  "success": true,
  "data": [
    {
      "id": "cjld2cjxh0000qzrmn831i7rn",
      "machineId": "cjld2cjxh0000qzrmn831i7rn",
      "temperature": 25.5,
      "humidity": 45.2,
      "sales": 42,
      "errors": [],
      "rawData": { "...": "..." },
      "createdAt": "2025-07-10T14:00:00.000Z"
    }
  ]
}
```

### Получение статистики по автоматам

```
GET /machines/stats
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "total": 42,
    "byStatus": {
      "ONLINE": 30,
      "OFFLINE": 5,
      "MAINTENANCE": 5,
      "ERROR": 2
    },
    "byType": {
      "COFFEE": 25,
      "SNACK": 10,
      "COMBO": 7
    },
    "withErrors": 2,
    "telemetryLast24h": 1024
  }
}
```

## Задачи

### Получение списка задач

```
GET /tasks
```

#### Параметры запроса

| Параметр     | Тип     | Описание                                                                 |
| ------------ | ------- | ------------------------------------------------------------------------ |
| status       | string  | Фильтр по статусу (CREATED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED) |
| assignedToId | string  | Фильтр по исполнителю                                                    |
| machineId    | string  | Фильтр по автомату                                                       |
| skip         | integer | Смещение для пагинации (по умолчанию 0)                                  |
| take         | integer | Количество записей (по умолчанию 20, максимум 100)                       |
| orderBy      | string  | Поле для сортировки (createdAt, updatedAt, priority)                     |
| order        | string  | Порядок сортировки (asc, desc)                                           |

#### Ответ

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "title": "Пополнить запасы",
        "description": "Необходимо пополнить запасы кофе и стаканчиков",
        "status": "ASSIGNED",
        "priority": "HIGH",
        "dueDate": "2025-07-11T14:00:00.000Z",
        "completedAt": null,
        "machine": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "code": "CVM-00001",
          "name": "Кофейный автомат #1",
          "location": {
            "id": "cjld2cjxh0000qzrmn831i7rn",
            "name": "ТЦ Мега",
            "address": "ул. Примерная, 123"
          }
        },
        "assignedTo": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "name": "Иван Иванов",
          "email": "ivan@example.com"
        },
        "createdBy": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "name": "Петр Петров",
          "email": "petr@example.com"
        },
        "createdAt": "2025-07-10T14:00:00.000Z",
        "updatedAt": "2025-07-10T14:00:00.000Z"
      }
    ],
    "total": 42,
    "skip": 0,
    "take": 20
  }
}
```

### Получение информации о задаче

```
GET /tasks/:id
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "title": "Пополнить запасы",
    "description": "Необходимо пополнить запасы кофе и стаканчиков",
    "status": "ASSIGNED",
    "priority": "HIGH",
    "dueDate": "2025-07-11T14:00:00.000Z",
    "completedAt": null,
    "machine": {
      "id": "cjld2cjxh0000qzrmn831i7rn",
      "code": "CVM-00001",
      "name": "Кофейный автомат #1",
      "location": {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "name": "ТЦ Мега",
        "address": "ул. Примерная, 123"
      }
    },
    "assignedTo": {
      "id": "cjld2cjxh0000qzrmn831i7rn",
      "name": "Иван Иванов",
      "email": "ivan@example.com"
    },
    "createdBy": {
      "id": "cjld2cjxh0000qzrmn831i7rn",
      "name": "Петр Петров",
      "email": "petr@example.com"
    },
    "actions": [
      {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "action": "CREATED",
        "comment": "Task created: Пополнить запасы",
        "user": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "name": "Петр Петров",
          "email": "petr@example.com"
        },
        "createdAt": "2025-07-10T14:00:00.000Z"
      }
    ],
    "createdAt": "2025-07-10T14:00:00.000Z",
    "updatedAt": "2025-07-10T14:00:00.000Z"
  }
}
```

### Создание задачи

```
POST /tasks
```

#### Тело запроса

```json
{
  "title": "Пополнить запасы",
  "description": "Необходимо пополнить запасы кофе и стаканчиков",
  "machineId": "cjld2cjxh0000qzrmn831i7rn",
  "assignedToId": "cjld2cjxh0000qzrmn831i7rn",
  "priority": "HIGH",
  "dueDate": "2025-07-11T14:00:00.000Z"
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "title": "Пополнить запасы",
    "description": "Необходимо пополнить запасы кофе и стаканчиков",
    "status": "ASSIGNED",
    "priority": "HIGH",
    "dueDate": "2025-07-11T14:00:00.000Z",
    "completedAt": null,
    "machineId": "cjld2cjxh0000qzrmn831i7rn",
    "assignedToId": "cjld2cjxh0000qzrmn831i7rn",
    "createdById": "cjld2cjxh0000qzrmn831i7rn",
    "createdAt": "2025-07-10T14:00:00.000Z",
    "updatedAt": "2025-07-10T14:00:00.000Z"
  }
}
```

### Обновление задачи

```
PATCH /tasks/:id
```

#### Тело запроса

```json
{
  "status": "IN_PROGRESS",
  "assignedToId": "cjld2cjxh0000qzrmn831i7rn",
  "priority": "URGENT"
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "title": "Пополнить запасы",
    "description": "Необходимо пополнить запасы кофе и стаканчиков",
    "status": "IN_PROGRESS",
    "priority": "URGENT",
    "dueDate": "2025-07-11T14:00:00.000Z",
    "completedAt": null,
    "machineId": "cjld2cjxh0000qzrmn831i7rn",
    "assignedToId": "cjld2cjxh0000qzrmn831i7rn",
    "createdById": "cjld2cjxh0000qzrmn831i7rn",
    "createdAt": "2025-07-10T14:00:00.000Z",
    "updatedAt": "2025-07-10T14:30:00.000Z"
  }
}
```

### Добавление действия к задаче

```
POST /tasks/:id/actions
```

#### Тело запроса

```json
{
  "action": "COMMENT",
  "comment": "Выехал на место",
  "location": {
    "latitude": 55.123456,
    "longitude": 37.123456
  },
  "photoUrls": ["https://example.com/photo1.jpg"]
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "taskId": "cjld2cjxh0000qzrmn831i7rn",
    "userId": "cjld2cjxh0000qzrmn831i7rn",
    "action": "COMMENT",
    "comment": "Выехал на место",
    "location": "55.123456,37.123456",
    "photoUrls": ["https://example.com/photo1.jpg"],
    "createdAt": "2025-07-10T14:30:00.000Z",
    "user": {
      "id": "cjld2cjxh0000qzrmn831i7rn",
      "name": "Иван Иванов",
      "email": "ivan@example.com"
    }
  }
}
```

### Получение статистики по задачам

```
GET /tasks/stats
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "total": 42,
    "byStatus": {
      "CREATED": 10,
      "ASSIGNED": 15,
      "IN_PROGRESS": 5,
      "COMPLETED": 10,
      "CANCELLED": 2
    },
    "byPriority": {
      "LOW": 5,
      "MEDIUM": 20,
      "HIGH": 15,
      "URGENT": 2
    },
    "overdue": 3
  }
}
```

## Инвентарь

### Получение списка товаров/ингредиентов

```
GET /inventory/items
```

#### Параметры запроса

| Параметр | Тип     | Описание                                                  |
| -------- | ------- | --------------------------------------------------------- |
| category | string  | Фильтр по категории                                       |
| search   | string  | Поиск по имени или SKU                                    |
| inStock  | boolean | Фильтр по наличию (true - в наличии, false - отсутствует) |
| skip     | integer | Смещение для пагинации (по умолчанию 0)                   |
| take     | integer | Количество записей (по умолчанию 20, максимум 100)        |

#### Ответ

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "name": "Кофе в зернах",
        "sku": "COFFEE-001",
        "unit": "KG",
        "category": "COFFEE",
        "description": "Кофе в зернах арабика",
        "quantity": 10.5,
        "minQuantity": 5.0,
        "maxQuantity": 20.0,
        "price": 1200.0,
        "isActive": true,
        "lastUpdated": "2025-07-10T14:00:00.000Z",
        "createdAt": "2025-07-01T14:00:00.000Z",
        "updatedAt": "2025-07-10T14:00:00.000Z",
        "stockMovements": [
          {
            "id": "cjld2cjxh0000qzrmn831i7rn",
            "type": "IN",
            "quantity": 5.0,
            "createdAt": "2025-07-10T14:00:00.000Z"
          }
        ]
      }
    ],
    "total": 42,
    "skip": 0,
    "take": 20
  }
}
```

### Получение информации о товаре

```
GET /inventory/items/:id
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "name": "Кофе в зернах",
    "sku": "COFFEE-001",
    "unit": "KG",
    "category": "COFFEE",
    "description": "Кофе в зернах арабика",
    "quantity": 10.5,
    "minQuantity": 5.0,
    "maxQuantity": 20.0,
    "price": 1200.0,
    "isActive": true,
    "lastUpdated": "2025-07-10T14:00:00.000Z",
    "createdAt": "2025-07-01T14:00:00.000Z",
    "updatedAt": "2025-07-10T14:00:00.000Z",
    "stockMovements": [
      {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "type": "IN",
        "quantity": 5.0,
        "quantityBefore": 5.5,
        "quantityAfter": 10.5,
        "reason": "Поставка",
        "createdAt": "2025-07-10T14:00:00.000Z",
        "user": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "name": "Иван Иванов",
          "email": "ivan@example.com"
        }
      }
    ]
  }
}
```

### Создание товара

```
POST /inventory/items
```

#### Тело запроса

```json
{
  "name": "Кофе в зернах",
  "sku": "COFFEE-001",
  "unit": "KG",
  "category": "COFFEE",
  "description": "Кофе в зернах арабика",
  "minQuantity": 5.0,
  "maxQuantity": 20.0,
  "price": 1200.0
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "name": "Кофе в зернах",
    "sku": "COFFEE-001",
    "unit": "KG",
    "category": "COFFEE",
    "description": "Кофе в зернах арабика",
    "quantity": 0.0,
    "minQuantity": 5.0,
    "maxQuantity": 20.0,
    "price": 1200.0,
    "isActive": true,
    "lastUpdated": "2025-07-10T14:00:00.000Z",
    "createdAt": "2025-07-10T14:00:00.000Z",
    "updatedAt": "2025-07-10T14:00:00.000Z"
  }
}
```

### Движение товара (приход/расход)

```
POST /inventory/stock-movement
```

#### Тело запроса

```json
{
  "itemId": "cjld2cjxh0000qzrmn831i7rn",
  "type": "IN",
  "quantity": 5.0,
  "reason": "Поставка",
  "reference": "PO-12345",
  "machineId": "cjld2cjxh0000qzrmn831i7rn"
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "movement": {
      "id": "cjld2cjxh0000qzrmn831i7rn",
      "itemId": "cjld2cjxh0000qzrmn831i7rn",
      "userId": "cjld2cjxh0000qzrmn831i7rn",
      "type": "IN",
      "quantity": 5.0,
      "quantityBefore": 5.5,
      "quantityAfter": 10.5,
      "reason": "Поставка",
      "reference": "PO-12345",
      "machineId": "cjld2cjxh0000qzrmn831i7rn",
      "createdAt": "2025-07-10T14:00:00.000Z"
    },
    "item": {
      "id": "cjld2cjxh0000qzrmn831i7rn",
      "name": "Кофе в зернах",
      "quantity": 10.5,
      "lastUpdated": "2025-07-10T14:00:00.000Z"
    }
  }
}
```

### Получение истории движений

```
GET /inventory/movements
```

#### Параметры запроса

| Параметр  | Тип     | Описание                                           |
| --------- | ------- | -------------------------------------------------- |
| itemId    | string  | Фильтр по товару                                   |
| type      | string  | Фильтр по типу (IN, OUT, ADJUSTMENT, TRANSFER)     |
| machineId | string  | Фильтр по автомату                                 |
| dateFrom  | string  | Начальная дата (ISO 8601)                          |
| dateTo    | string  | Конечная дата (ISO 8601)                           |
| skip      | integer | Смещение для пагинации (по умолчанию 0)            |
| take      | integer | Количество записей (по умолчанию 20, максимум 100) |

#### Ответ

```json
{
  "success": true,
  "data": {
    "movements": [
      {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "itemId": "cjld2cjxh0000qzrmn831i7rn",
        "userId": "cjld2cjxh0000qzrmn831i7rn",
        "type": "IN",
        "quantity": 5.0,
        "quantityBefore": 5.5,
        "quantityAfter": 10.5,
        "reason": "Поставка",
        "reference": "PO-12345",
        "machineId": "cjld2cjxh0000qzrmn831i7rn",
        "createdAt": "2025-07-10T14:00:00.000Z",
        "item": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "name": "Кофе в зернах",
          "sku": "COFFEE-001"
        },
        "user": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "name": "Иван Иванов",
          "email": "ivan@example.com"
        },
        "machine": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "code": "CVM-00001",
          "name": "Кофейный автомат #1"
        }
      }
    ],
    "total": 42,
    "skip": 0,
    "take": 20
  }
}
```

### Получение товаров с низким остатком

```
GET /inventory/low-stock
```

#### Ответ

```json
{
  "success": true,
  "data": [
    {
      "id": "cjld2cjxh0000qzrmn831i7rn",
      "name": "Кофе в зернах",
      "sku": "COFFEE-001",
      "unit": "KG",
      "category": "COFFEE",
      "quantity": 4.5,
      "minQuantity": 5.0,
      "maxQuantity": 20.0
    }
  ]
}
```

## Маршруты

### Получение списка маршрутов

```
GET /routes
```

#### Параметры запроса

| Параметр | Тип     | Описание                                                       |
| -------- | ------- | -------------------------------------------------------------- |
| status   | string  | Фильтр по статусу (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED) |
| driverId | string  | Фильтр по водителю                                             |
| skip     | integer | Смещение для пагинации (по умолчанию 0)                        |
| take     | integer | Количество записей (по умолчанию 20, максимум 100)             |

#### Ответ

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cjld2cjxh0000qzrmn831i7rn",
        "name": "Маршрут #1",
        "description": "Обслуживание автоматов в ТЦ Мега",
        "status": "PLANNED",
        "startTime": "2025-07-11T09:00:00.000Z",
        "endTime": null,
        "totalDistance": 15.5,
        "driver": {
          "id": "cjld2cjxh0000qzrmn831i7rn",
          "name": "Иван Иванов"
        },
        "createdAt": "2025-07-10T14:00:00.000Z",
        "updatedAt": "2025-07-10T14:00:00.000Z"
      }
    ],
    "total": 42,
    "skip": 0,
    "take": 20
  }
}
```

### Получение информации о маршруте

```
GET /routes/:id
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "name
```
