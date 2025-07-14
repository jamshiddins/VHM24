#!/usr/bin/env node

const fs = require('fs');
const path = require('path');



const schemaPath = 'backend/prisma/schema.prisma';

if (!fs.existsSync(schemaPath)) {
    console.error('❌ Prisma schema not found!');
    process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('📝 Fixing @relation($1) issues...');

// Fix all @relation($1) back to proper @relation syntax
schema = schema.replace(/@relation\(\$1\)/g, '@relation(fields: [id], references: [id])');

// Fix specific relation fields properly
const relationFixes = [
    // Machine model
    {
        field: 'location    Location?',
        fix: 'location    Location? @relation(fields: [locationId], references: [id])'
    },
    // Hopper model
    {
        field: 'ingredient    Ingredient',
        fix: 'ingredient    Ingredient  @relation(fields: [ingredientId], references: [id])'
    },
    {
        field: 'machine       Machine?',
        fix: 'machine       Machine?    @relation(fields: [machineId], references: [id])'
    },
    {
        field: 'bag           Bag?',
        fix: 'bag           Bag?        @relation(fields: [bagId], references: [id])'
    },
    // Water model
    {
        field: 'machine     Machine?',
        fix: 'machine     Machine?  @relation(fields: [machineId], references: [id])'
    },
    // Syrup model - already handled above
    // Consumable model - already handled above
    // Recipe model - already handled above
    // RecipeItem model
    {
        field: 'recipe       Recipe',
        fix: 'recipe       Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)'
    },
    {
        field: 'ingredient   Ingredient',
        fix: 'ingredient   Ingredient @relation(fields: [ingredientId], references: [id])'
    },
    // Task model - already handled above
    {
        field: 'assignee    User',
        fix: 'assignee    User     @relation(fields: [assignedTo], references: [id])'
    },
    {
        field: 'route       Route?',
        fix: 'route       Route?   @relation(fields: [routeId], references: [id])'
    },
    // Route model
    {
        field: 'operator    User',
        fix: 'operator    User      @relation(fields: [operatorId], references: [id])'
    },
    // RouteStop model
    {
        field: 'route     Route',
        fix: 'route     Route    @relation(fields: [routeId], references: [id], onDelete: Cascade)'
    },
    {
        field: 'task      Task?',
        fix: 'task      Task?    @relation(fields: [taskId], references: [id])'
    },
    // HopperMovement model
    {
        field: 'hopper      Hopper',
        fix: 'hopper      Hopper    @relation(fields: [hopperId], references: [id])'
    },
    {
        field: 'user        User',
        fix: 'user        User      @relation(fields: [userId], references: [id])'
    },
    // WaterMovement model
    {
        field: 'bottle        WaterBottle',
        fix: 'bottle        WaterBottle  @relation(fields: [bottleId], references: [id])'
    },
    // InventoryMovement model
    {
        field: 'ingredient    Ingredient',
        fix: 'ingredient    Ingredient   @relation(fields: [ingredientId], references: [id])'
    },
    // ActionLog model - user already handled
    // Sale model - machine already handled
    // CashCollection model
    {
        field: 'collector   User',
        fix: 'collector   User      @relation(fields: [collectorId], references: [id])'
    },
    // Expense model - already handled
    // Income model - user already handled
    // Movement model
    {
        field: 'item        Item?',
        fix: 'item        Item?         @relation(fields: [itemId], references: [id])'
    }
];

// Apply specific fixes for relation fields that need proper field/reference mapping
schema = schema.replace(/location    Location\? @relation\(fields: \[id\], references: \[id\]\)/g, 
    'location    Location? @relation(fields: [locationId], references: [id])');

schema = schema.replace(/ingredient    Ingredient  @relation\(fields: \[id\], references: \[id\]\)/g, 
    'ingredient    Ingredient  @relation(fields: [ingredientId], references: [id])');

schema = schema.replace(/machine       Machine\?    @relation\(fields: \[id\], references: \[id\]\)/g, 
    'machine       Machine?    @relation(fields: [machineId], references: [id])');

schema = schema.replace(/bag           Bag\?        @relation\(fields: \[id\], references: \[id\]\)/g, 
    'bag           Bag?        @relation(fields: [bagId], references: [id])');

schema = schema.replace(/machine     Machine\?  @relation\(fields: \[id\], references: \[id\]\)/g, 
    'machine     Machine?  @relation(fields: [machineId], references: [id])');

schema = schema.replace(/recipe       Recipe     @relation\(fields: \[id\], references: \[id\]\)/g, 
    'recipe       Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)');

schema = schema.replace(/ingredient   Ingredient @relation\(fields: \[id\], references: \[id\]\)/g, 
    'ingredient   Ingredient @relation(fields: [ingredientId], references: [id])');

schema = schema.replace(/assignee    User     @relation\(fields: \[id\], references: \[id\]\)/g, 
    'assignee    User     @relation(fields: [assignedTo], references: [id])');

schema = schema.replace(/route       Route\?   @relation\(fields: \[id\], references: \[id\]\)/g, 
    'route       Route?   @relation(fields: [routeId], references: [id])');

schema = schema.replace(/operator    User      @relation\(fields: \[id\], references: \[id\]\)/g, 
    'operator    User      @relation(fields: [operatorId], references: [id])');

schema = schema.replace(/route     Route    @relation\(fields: \[id\], references: \[id\]\)/g, 
    'route     Route    @relation(fields: [routeId], references: [id], onDelete: Cascade)');

schema = schema.replace(/task      Task\?    @relation\(fields: \[id\], references: \[id\]\)/g, 
    'task      Task?    @relation(fields: [taskId], references: [id])');

schema = schema.replace(/hopper      Hopper    @relation\(fields: \[id\], references: \[id\]\)/g, 
    'hopper      Hopper    @relation(fields: [hopperId], references: [id])');

schema = schema.replace(/user        User      @relation\(fields: \[id\], references: \[id\]\)/g, 
    'user        User      @relation(fields: [userId], references: [id])');

schema = schema.replace(/bottle        WaterBottle  @relation\(fields: \[id\], references: \[id\]\)/g, 
    'bottle        WaterBottle  @relation(fields: [bottleId], references: [id])');

schema = schema.replace(/collector   User      @relation\(fields: \[id\], references: \[id\]\)/g, 
    'collector   User      @relation(fields: [collectorId], references: [id])');

schema = schema.replace(/item        Item\?         @relation\(fields: \[id\], references: \[id\]\)/g, 
    'item        Item?         @relation(fields: [itemId], references: [id])');

// Fix any remaining generic @relation(fields: [id], references: [id])
schema = schema.replace(/@relation\(fields: \[id\], references: \[id\]\)/g, '@relation');


fs.writeFileSync(schemaPath, schema);




const { execSync } = require('child_process');

try {
    execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
    
} catch (error) {
    console.error('❌ Error generating Prisma client:', error.message);
    process.exit(1);
}


