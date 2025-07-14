
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
