# VendHub - Диаграммы архитектуры

## 1. Общая архитектура системы

```mermaid
graph TB
    subgraph "Frontend"
        TG[Telegram Bot]
        WEB[Web Dashboard<br/>опционально]
    end
    
    subgraph "API Gateway"
        GW[API Gateway<br/>JWT Auth]
    end
    
    subgraph "Микросервисы"
        MS1[Machines<br/>Service]
        MS2[Bunkers<br/>Service]
        MS3[Inventory<br/>Service]
        MS4[Finance<br/>Service]
        MS5[Recipes<br/>Service]
        MS6[Reports<br/>Service]
    end
    
    subgraph "Хранилища"
        DB[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[S3 Storage<br/>MinIO]
    end
    
    TG --> GW
    WEB --> GW
    GW --> MS1
    GW --> MS2
    GW --> MS3
    GW --> MS4
    GW --> MS5
    GW --> MS6
    
    MS1 --> DB
    MS2 --> DB
    MS3 --> DB
    MS4 --> DB
    MS5 --> DB
    MS6 --> DB
    
    MS1 --> REDIS
    MS2 --> REDIS
    MS6 --> REDIS
    
    TG --> S3
```

## 2. Структура базы данных (основные связи)

```mermaid
erDiagram
    User ||--o{ Machine : "operates"
    Machine ||--o{ BunkerPosition : "has"
    BunkerPosition ||--o| Bunker : "contains"
    Bunker ||--o{ BunkerOperation : "has"
    Bunker ||--o{ BunkerFill : "filled"
    
    Machine ||--o{ SyrupInMachine : "has"
    Syrup ||--o{ SyrupInMachine : "installed"
    Syrup ||--o{ SyrupOperation : "has"
    
    Machine ||--o{ WaterBottle : "has"
    WaterBottle ||--o{ WaterOperation : "has"
    
    Machine ||--o{ Revenue : "generates"
    Revenue ||--|| Transaction : "creates"
    
    Supplier ||--o{ SupplierContract : "has"
    SupplierContract ||--o{ Batch : "delivers"
    Batch ||--o{ BunkerFill : "used"
    
    Recipe ||--o{ RecipeVersion : "has"
    RecipeVersion ||--o{ RecipeIngredient : "contains"
    Machine ||--o{ MachineRecipe : "offers"
```

## 3. Telegram Bot FSM Flow

```mermaid
stateDiagram-v2
    [*] --> START
    START --> AUTH: New User
    START --> MAIN_MENU: Existing User
    
    AUTH --> PHONE_REQUEST
    PHONE_REQUEST --> PHONE_CONFIRM
    PHONE_CONFIRM --> MAIN_MENU: Success
    
    MAIN_MENU --> WAREHOUSE_MENU: Role=WAREHOUSE
    MAIN_MENU --> OPERATOR_MENU: Role=OPERATOR
    MAIN_MENU --> MANAGER_MENU: Role=MANAGER
    MAIN_MENU --> ADMIN_MENU: Role=ADMIN
    
    OPERATOR_MENU --> BUNKER_OPS
    BUNKER_OPS --> BUNKER_SELECT
    BUNKER_SELECT --> BUNKER_WEIGH_EMPTY
    BUNKER_WEIGH_EMPTY --> BUNKER_FILL
    BUNKER_FILL --> BUNKER_WEIGH_FULL
    BUNKER_WEIGH_FULL --> BUNKER_PHOTO
    BUNKER_PHOTO --> BUNKER_CONFIRM
    BUNKER_CONFIRM --> OPERATOR_MENU
```

## 4. Процесс заполнения бункера

```mermaid
sequenceDiagram
    participant O as Оператор
    participant T as Telegram Bot
    participant API as API Gateway
    participant BS as Bunker Service
    participant DB as Database
    participant S3 as S3 Storage
    
    O->>T: /fill_bunker
    T->>O: Выберите бункер
    O->>T: SET-005-1CO
    T->>API: GET /bunkers/SET-005-1CO
    API->>BS: getBunker()
    BS->>DB: SELECT bunker
    DB-->>BS: Bunker data
    BS-->>API: Bunker info
    API-->>T: Status, location
    T->>O: Введите вес пустого
    O->>T: 450
    T->>O: Выберите партию
    O->>T: PARTY-2024-COFF-10
    T->>O: Введите вес полного
    O->>T: 1450
    T->>O: Отправьте фото
    O->>T: [Photo]
    T->>S3: Upload photo
    S3-->>T: Photo URL
    T->>API: POST /bunkers/fill
    API->>BS: createOperation()
    BS->>DB: INSERT operation
    DB-->>BS: Success
    BS-->>API: Operation created
    API-->>T: Success
    T->>O: ✅ Операция сохранена
```

## 5. Финансовый поток

```mermaid
flowchart LR
    subgraph "Доходы"
        QR[QR платежи]
        CASH[Наличные]
        VIP[VIP карты]
        RENT[Аренда]
    end
    
    subgraph "Автомат"
        M[Machine<br/>VM-015]
        REV[Revenue<br/>Record]
    end
    
    subgraph "Финансы"
        TR[Transaction]
        REP[Reports]
    end
    
    QR --> M
    CASH --> M
    VIP --> M
    M --> REV
    REV --> TR
    RENT --> TR
    TR --> REP
    
    subgraph "Расходы"
        ING[Ингредиенты]
        RNT[Аренда места]
        SAL[Зарплата]
        REP2[Ремонт]
    end
    
    ING --> TR
    RNT --> TR
    SAL --> TR
    REP2 --> TR
```

## 6. Учет компонентов

```mermaid
graph TD
    subgraph "Склад"
        B1[Партия кофе<br/>50 кг]
        B2[Партия сливок<br/>30 кг]
        S1[Сиропы<br/>20 бутылок]
        W1[Вода<br/>100 бутылок]
    end
    
    subgraph "Выдача оператору"
        OP[Оператор Петров]
        BUN1[Бункер SET-005-1CO]
        BUN2[Бункер SET-005-2CR]
        SYR1[Сироп Карамель]
        WAT1[Вода 18.9л x4]
    end
    
    subgraph "Автомат VM-015"
        POS1[Позиция 1: Кофе]
        POS2[Позиция 2: Сливки]
        SYRPOS[Сироп: Карамель]
        WATPOS[Вода: 2 бутылки]
    end
    
    B1 -.->|5 кг| OP
    B2 -.->|3 кг| OP
    S1 -.->|1 шт| OP
    W1 -.->|4 шт| OP
    
    OP -->|Заполнен 1кг| BUN1
    OP -->|Заполнен 0.8кг| BUN2
    OP --> SYR1
    OP --> WAT1
    
    BUN1 -->|Установлен| POS1
    BUN2 -->|Установлен| POS2
    SYR1 -->|Установлен| SYRPOS
    WAT1 -->|2 шт| WATPOS
```

## 7. Расчет себестоимости

```mermaid
graph LR
    subgraph "Рецепт: Капучино"
        R1[Кофе: 7г]
        R2[Сливки: 3г]
        R3[Сахар: 5г]
        R4[Вода: 150мл]
        R5[Сироп: 20мл]
    end
    
    subgraph "Стоимость ингредиентов"
        C1[120 сум/г]
        C2[80 сум/г]
        C3[30 сум/г]
        C4[0.5 сум/мл]
        C5[50 сум/мл]
    end
    
    subgraph "Расчет"
        CALC[7×120 + 3×80 +<br/>5×30 + 150×0.5 +<br/>20×50 = 2,305 сум]
    end
    
    R1 --> C1
    R2 --> C2
    R3 --> C3
    R4 --> C4
    R5 --> C5
    
    C1 --> CALC
    C2 --> CALC
    C3 --> CALC
    C4 --> CALC
    C5 --> CALC
    
    CALC --> TOTAL[Себестоимость: 2,305 сум<br/>Цена продажи: 15,000 сум<br/>Маржа: 85%]
```

## 8. Мониторинг и уведомления

```mermaid
flowchart TD
    subgraph "Источники событий"
        M1[Автомат<br/>VM-015]
        M2[Автомат<br/>VM-020]
        B1[Склад]
        F1[Финансы]
    end
    
    subgraph "События"
        E1[Низкий уровень<br/>кофе < 20%]
        E2[Срок годности<br/>истекает]
        E3[Требуется<br/>обслуживание]
        E4[Выручка<br/>собрана]
    end
    
    subgraph "Обработка"
        Q[Event Queue]
        P[Processor]
        R[Rules Engine]
    end
    
    subgraph "Уведомления"
        N1[Telegram<br/>Оператор]
        N2[Email<br/>Менеджер]
        N3[Dashboard<br/>Alert]
    end
    
    M1 --> E1
    M2 --> E3
    B1 --> E2
    F1 --> E4
    
    E1 --> Q
    E2 --> Q
    E3 --> Q
    E4 --> Q
    
    Q --> P
    P --> R
    
    R -->|Priority: HIGH| N1
    R -->|Daily Report| N2
    R -->|Real-time| N3
```

## 9. Интеграции

```mermaid
graph TB
    subgraph "VendHub Core"
        API[API Gateway]
        DB[(PostgreSQL)]
    end
    
    subgraph "Платежные системы"
        PAYME[Payme API]
        CLICK[Click API]
        UZCARD[UzCard API]
    end
    
    subgraph "Коммуникации"
        TG[Telegram API]
        SMS[SMS Gateway]
        EMAIL[Email Service]
    end
    
    subgraph "Хранилище"
        S3[MinIO S3]
        BACKUP[Backup Storage]
    end
    
    subgraph "Мониторинг"
        PROM[Prometheus]
        GRAF[Grafana]
        SENTRY[Sentry]
    end
    
    API --> PAYME
    API --> CLICK
    API --> UZCARD
    
    API --> TG
    API --> SMS
    API --> EMAIL
    
    API --> S3
    DB --> BACKUP
    
    API --> PROM
    PROM --> GRAF
    API --> SENTRY
```

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/HAProxy]
    end
    
    subgraph "Kubernetes Cluster"
        subgraph "Services"
            POD1[API Gateway<br/>3 replicas]
            POD2[Machines Service<br/>2 replicas]
            POD3[Bunkers Service<br/>2 replicas]
            POD4[Telegram Bot<br/>1 replica]
        end
        
        subgraph "Data Layer"
            PG[PostgreSQL<br/>Primary]
            PGR[PostgreSQL<br/>Read Replica]
            REDIS[Redis Cluster]
        end
        
        subgraph "Storage"
            PV[Persistent<br/>Volumes]
            S3[MinIO]
        end
    end
    
    subgraph "External"
        CDN[CDN for media]
        MON[Monitoring]
    end
    
    LB --> POD1
    POD1 --> POD2
    POD1 --> POD3
    
    POD2 --> PG
    POD2 --> PGR
    POD3 --> PG
    POD3 --> REDIS
    
    POD4 --> POD1
    S3 --> CDN
    
    PG --> PV
    S3 --> PV
