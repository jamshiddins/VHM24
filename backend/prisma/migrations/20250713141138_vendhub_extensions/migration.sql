-- CreateEnum
CREATE TYPE "SyrupBottleStatus" AS ENUM ('ON_WAREHOUSE', 'ASSIGNED', 'IN_MACHINE', 'OPENED', 'EMPTY', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WaterBottleStatus" AS ENUM ('ON_WAREHOUSE', 'ASSIGNED', 'IN_MACHINE', 'EMPTY', 'NEEDS_REPLACEMENT');

-- CreateEnum
CREATE TYPE "BagStatus" AS ENUM ('CREATED', 'PACKED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED');

-- CreateEnum
CREATE TYPE "SyrupOperationType" AS ENUM ('RECEIVED', 'ASSIGNED', 'INSTALLED', 'OPENED', 'REMOVED', 'RETURNED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WaterOperationType" AS ENUM ('RECEIVED', 'ASSIGNED', 'INSTALLED', 'WEIGHT_CHECK', 'REMOVED', 'RETURNED', 'REPLACED');

-- CreateEnum
CREATE TYPE "BagOperationType" AS ENUM ('CREATED', 'PACKED', 'ASSIGNED', 'DELIVERED', 'RETURNED', 'UNPACKED');

-- CreateEnum
CREATE TYPE "RevenueSource" AS ENUM ('SALES', 'QR_PAYME', 'QR_CLICK', 'QR_UZUM', 'CASH', 'VIP_SALE', 'TEST_SALE', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'QR', 'CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('INGREDIENTS', 'SUPPLIES', 'MAINTENANCE', 'RENT', 'UTILITIES', 'TRANSPORT', 'SALARY', 'TAXES', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "IncassationStatus" AS ENUM ('COLLECTED', 'HANDED_OVER', 'DEPOSITED', 'DISCREPANCY');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'RETURNED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'INVESTOR';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "bagId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedMachines" TEXT[],
ADD COLUMN     "warehouseAccess" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SyrupBottle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bottleId" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "status" "SyrupBottleStatus" NOT NULL DEFAULT 'ON_WAREHOUSE',
    "openedAt" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "machineId" TEXT,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyrupBottle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterBottle" (
    "id" TEXT NOT NULL,
    "bottleId" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "weightEmpty" DOUBLE PRECISION NOT NULL,
    "weightFull" DOUBLE PRECISION NOT NULL,
    "weightCurrent" DOUBLE PRECISION NOT NULL,
    "status" "WaterBottleStatus" NOT NULL DEFAULT 'ON_WAREHOUSE',
    "assignedTo" TEXT,
    "machineId" TEXT,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterBottle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bag" (
    "id" TEXT NOT NULL,
    "bagId" TEXT NOT NULL,
    "status" "BagStatus" NOT NULL DEFAULT 'CREATED',
    "assignedTo" TEXT,
    "machineId" TEXT,
    "description" TEXT,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BagContent" (
    "id" TEXT NOT NULL,
    "bagId" TEXT NOT NULL,
    "bunkerId" TEXT,
    "syrupId" TEXT,
    "itemId" TEXT,
    "quantity" DOUBLE PRECISION,

    CONSTRAINT "BagContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyrupOperation" (
    "id" TEXT NOT NULL,
    "syrupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SyrupOperationType" NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT[],
    "eventTime" TIMESTAMP(3) NOT NULL,
    "inputTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "SyrupOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterOperation" (
    "id" TEXT NOT NULL,
    "bottleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WaterOperationType" NOT NULL,
    "description" TEXT NOT NULL,
    "weightBefore" DOUBLE PRECISION,
    "weightAfter" DOUBLE PRECISION,
    "photos" TEXT[],
    "eventTime" TIMESTAMP(3) NOT NULL,
    "inputTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "WaterOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BagOperation" (
    "id" TEXT NOT NULL,
    "bagId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BagOperationType" NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT[],
    "eventTime" TIMESTAMP(3) NOT NULL,
    "inputTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "BagOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revenue" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "source" "RevenueSource" NOT NULL,
    "machineId" TEXT,
    "userId" TEXT,
    "paymentType" "PaymentType" NOT NULL,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "fiscalized" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "metadata" JSONB,
    "photos" TEXT[],
    "eventTime" TIMESTAMP(3) NOT NULL,
    "inputTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "category" "ExpenseCategory" NOT NULL,
    "subcategory" TEXT,
    "machineId" TEXT,
    "userId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "supplierId" TEXT,
    "description" TEXT NOT NULL,
    "receiptPhoto" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "inputTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incassation" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "managerId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "photos" TEXT[],
    "status" "IncassationStatus" NOT NULL DEFAULT 'COLLECTED',
    "description" TEXT,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "handoverTime" TIMESTAMP(3),
    "inputTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incassation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contactInfo" JSONB,
    "paymentTerms" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReconciliation" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "salesFromMachine" DOUBLE PRECISION NOT NULL,
    "cashCollected" DOUBLE PRECISION NOT NULL,
    "qrPayments" DOUBLE PRECISION NOT NULL,
    "vipSales" DOUBLE PRECISION NOT NULL,
    "testSales" DOUBLE PRECISION NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "discrepancy" DOUBLE PRECISION NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientReconciliation" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "normativeConsumption" DOUBLE PRECISION NOT NULL,
    "actualConsumption" DOUBLE PRECISION NOT NULL,
    "discrepancy" DOUBLE PRECISION NOT NULL,
    "discrepancyPercent" DOUBLE PRECISION NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientBatch" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "productionDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "quantity" DOUBLE PRECISION NOT NULL,
    "purchasePrice" DOUBLE PRECISION,
    "supplierId" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyrupBottle_bottleId_key" ON "SyrupBottle"("bottleId");

-- CreateIndex
CREATE INDEX "SyrupBottle_status_idx" ON "SyrupBottle"("status");

-- CreateIndex
CREATE INDEX "SyrupBottle_assignedTo_idx" ON "SyrupBottle"("assignedTo");

-- CreateIndex
CREATE INDEX "SyrupBottle_machineId_idx" ON "SyrupBottle"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "WaterBottle_bottleId_key" ON "WaterBottle"("bottleId");

-- CreateIndex
CREATE INDEX "WaterBottle_status_idx" ON "WaterBottle"("status");

-- CreateIndex
CREATE INDEX "WaterBottle_assignedTo_idx" ON "WaterBottle"("assignedTo");

-- CreateIndex
CREATE INDEX "WaterBottle_machineId_idx" ON "WaterBottle"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "Bag_bagId_key" ON "Bag"("bagId");

-- CreateIndex
CREATE INDEX "Bag_status_idx" ON "Bag"("status");

-- CreateIndex
CREATE INDEX "Bag_assignedTo_idx" ON "Bag"("assignedTo");

-- CreateIndex
CREATE INDEX "Bag_machineId_idx" ON "Bag"("machineId");

-- CreateIndex
CREATE INDEX "BagContent_bagId_idx" ON "BagContent"("bagId");

-- CreateIndex
CREATE INDEX "SyrupOperation_syrupId_idx" ON "SyrupOperation"("syrupId");

-- CreateIndex
CREATE INDEX "SyrupOperation_userId_idx" ON "SyrupOperation"("userId");

-- CreateIndex
CREATE INDEX "SyrupOperation_type_idx" ON "SyrupOperation"("type");

-- CreateIndex
CREATE INDEX "SyrupOperation_eventTime_idx" ON "SyrupOperation"("eventTime");

-- CreateIndex
CREATE INDEX "WaterOperation_bottleId_idx" ON "WaterOperation"("bottleId");

-- CreateIndex
CREATE INDEX "WaterOperation_userId_idx" ON "WaterOperation"("userId");

-- CreateIndex
CREATE INDEX "WaterOperation_type_idx" ON "WaterOperation"("type");

-- CreateIndex
CREATE INDEX "WaterOperation_eventTime_idx" ON "WaterOperation"("eventTime");

-- CreateIndex
CREATE INDEX "BagOperation_bagId_idx" ON "BagOperation"("bagId");

-- CreateIndex
CREATE INDEX "BagOperation_userId_idx" ON "BagOperation"("userId");

-- CreateIndex
CREATE INDEX "BagOperation_type_idx" ON "BagOperation"("type");

-- CreateIndex
CREATE INDEX "BagOperation_eventTime_idx" ON "BagOperation"("eventTime");

-- CreateIndex
CREATE INDEX "Revenue_machineId_idx" ON "Revenue"("machineId");

-- CreateIndex
CREATE INDEX "Revenue_source_idx" ON "Revenue"("source");

-- CreateIndex
CREATE INDEX "Revenue_eventTime_idx" ON "Revenue"("eventTime");

-- CreateIndex
CREATE INDEX "Revenue_paymentType_idx" ON "Revenue"("paymentType");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_machineId_idx" ON "Expense"("machineId");

-- CreateIndex
CREATE INDEX "Expense_eventTime_idx" ON "Expense"("eventTime");

-- CreateIndex
CREATE INDEX "Incassation_machineId_idx" ON "Incassation"("machineId");

-- CreateIndex
CREATE INDEX "Incassation_operatorId_idx" ON "Incassation"("operatorId");

-- CreateIndex
CREATE INDEX "Incassation_eventTime_idx" ON "Incassation"("eventTime");

-- CreateIndex
CREATE INDEX "Supplier_type_idx" ON "Supplier"("type");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE INDEX "SalesReconciliation_date_idx" ON "SalesReconciliation"("date");

-- CreateIndex
CREATE INDEX "SalesReconciliation_status_idx" ON "SalesReconciliation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReconciliation_machineId_date_key" ON "SalesReconciliation"("machineId", "date");

-- CreateIndex
CREATE INDEX "IngredientReconciliation_date_idx" ON "IngredientReconciliation"("date");

-- CreateIndex
CREATE INDEX "IngredientReconciliation_status_idx" ON "IngredientReconciliation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientReconciliation_machineId_itemId_date_key" ON "IngredientReconciliation"("machineId", "itemId", "date");

-- CreateIndex
CREATE INDEX "IngredientBatch_status_idx" ON "IngredientBatch"("status");

-- CreateIndex
CREATE INDEX "IngredientBatch_expiryDate_idx" ON "IngredientBatch"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientBatch_itemId_batchNumber_key" ON "IngredientBatch"("itemId", "batchNumber");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_bagId_fkey" FOREIGN KEY ("bagId") REFERENCES "Bag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyrupBottle" ADD CONSTRAINT "SyrupBottle_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyrupBottle" ADD CONSTRAINT "SyrupBottle_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterBottle" ADD CONSTRAINT "WaterBottle_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterBottle" ADD CONSTRAINT "WaterBottle_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bag" ADD CONSTRAINT "Bag_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bag" ADD CONSTRAINT "Bag_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BagContent" ADD CONSTRAINT "BagContent_bagId_fkey" FOREIGN KEY ("bagId") REFERENCES "Bag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BagContent" ADD CONSTRAINT "BagContent_bunkerId_fkey" FOREIGN KEY ("bunkerId") REFERENCES "Bunker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BagContent" ADD CONSTRAINT "BagContent_syrupId_fkey" FOREIGN KEY ("syrupId") REFERENCES "SyrupBottle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BagContent" ADD CONSTRAINT "BagContent_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyrupOperation" ADD CONSTRAINT "SyrupOperation_syrupId_fkey" FOREIGN KEY ("syrupId") REFERENCES "SyrupBottle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyrupOperation" ADD CONSTRAINT "SyrupOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterOperation" ADD CONSTRAINT "WaterOperation_bottleId_fkey" FOREIGN KEY ("bottleId") REFERENCES "WaterBottle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterOperation" ADD CONSTRAINT "WaterOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BagOperation" ADD CONSTRAINT "BagOperation_bagId_fkey" FOREIGN KEY ("bagId") REFERENCES "Bag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BagOperation" ADD CONSTRAINT "BagOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incassation" ADD CONSTRAINT "Incassation_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incassation" ADD CONSTRAINT "Incassation_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incassation" ADD CONSTRAINT "Incassation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReconciliation" ADD CONSTRAINT "SalesReconciliation_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReconciliation" ADD CONSTRAINT "SalesReconciliation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientReconciliation" ADD CONSTRAINT "IngredientReconciliation_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientReconciliation" ADD CONSTRAINT "IngredientReconciliation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientReconciliation" ADD CONSTRAINT "IngredientReconciliation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientBatch" ADD CONSTRAINT "IngredientBatch_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientBatch" ADD CONSTRAINT "IngredientBatch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
