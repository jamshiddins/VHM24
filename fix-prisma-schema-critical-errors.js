#!/usr/bin/env node

const fs = require('fs');
const path = require('path');



const schemaPath = 'backend/prisma/schema.prisma';

if (!fs.existsSync(schemaPath)) {
    console.error('❌ Prisma schema not found!');
    process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');



// 1. Remove duplicate MovementType enum
schema = schema.replace(/enum MovementType\s*{[^}]*}\s*enum MovementType\s*{[^}]*}/g, 
    'enum MovementType {\n  IN\n  OUT\n  TRANSFER\n  ADJUSTMENT\n}');

// 2. Fix @id attributes on relation fields - remove them completely
schema = schema.replace(/@relation\([^)]*\)\s*@id\s*@default\(cuid\(\)\)/g, '@relation($1)');
schema = schema.replace(/@relation\([^)]*\)\s*@id/g, '@relation($1)');

// 3. Remove @id and @default from relation fields
const relationFieldPattern = /(\w+)\s+(\w+\??)\s+@relation\([^)]*\)\s*@id\s*@default\([^)]*\)/g;
schema = schema.replace(relationFieldPattern, '$1 $2 @relation(fields: [$1Id], references: [id])');

// 4. Fix specific problematic lines
const fixes = [
    // Machine model
    {
        search: 'location    Location? @relation(fields: [locationId], references: [id]) @id @default(cuid())',
        replace: 'location    Location? @relation(fields: [locationId], references: [id])'
    },
    // Hopper model
    {
        search: 'ingredient    Ingredient  @relation(fields: [ingredientId], references: [id]) @id @default(cuid())',
        replace: 'ingredient    Ingredient  @relation(fields: [ingredientId], references: [id])'
    },
    {
        search: 'machine       Machine?    @relation(fields: [machineId], references: [id]) @id @default(cuid())',
        replace: 'machine       Machine?    @relation(fields: [machineId], references: [id])'
    },
    {
        search: 'bag           Bag?        @relation(fields: [bagId], references: [id]) @id @default(cuid())',
        replace: 'bag           Bag?        @relation(fields: [bagId], references: [id])'
    },
    // Water model
    {
        search: 'machine     Machine?  @relation(fields: [machineId], references: [id]) @id @default(cuid())',
        replace: 'machine     Machine?  @relation(fields: [machineId], references: [id])'
    },
    // Syrup model
    {
        search: 'machine     Machine?    @relation(fields: [machineId], references: [id]) @id @default(cuid())',
        replace: 'machine     Machine?    @relation(fields: [machineId], references: [id])'
    },
    {
        search: 'bag         Bag?        @relation(fields: [bagId], references: [id]) @id @default(cuid())',
        replace: 'bag         Bag?        @relation(fields: [bagId], references: [id])'
    },
    // Consumable model
    {
        search: 'machine       Machine?          @relation(fields: [machineId], references: [id]) @id @default(cuid())',
        replace: 'machine       Machine?          @relation(fields: [machineId], references: [id])'
    },
    // Recipe model
    {
        search: 'machine     Machine?  @relation(fields: [machineId], references: [id]) @id @default(cuid())',
        replace: 'machine     Machine?  @relation(fields: [machineId], references: [id])'
    },
    // RecipeIngredient model
    {
        search: 'recipe       Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade) @id @default(cuid())',
        replace: 'recipe       Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)'
    },
    {
        search: 'ingredient   Ingredient @relation(fields: [ingredientId], references: [id]) @id @default(cuid())',
        replace: 'ingredient   Ingredient @relation(fields: [ingredientId], references: [id])'
    },
    // Task model
    {
        search: 'machine     Machine  @relation(fields: [machineId], references: [id]) @id @default(cuid())',
        replace: 'machine     Machine  @relation(fields: [machineId], references: [id])'
    },
    {
        search: 'assignee    User     @relation(fields: [assignedTo], references: [id]) @id @default(cuid())',
        replace: 'assignee    User     @relation(fields: [assignedTo], references: [id])'
    },
    {
        search: 'route       Route?   @relation(fields: [routeId], references: [id]) @id @default(cuid())',
        replace: 'route       Route?   @relation(fields: [routeId], references: [id])'
    },
    // Route model
    {
        search: 'operator    User      @relation(fields: [operatorId], references: [id]) @id @default(cuid())',
        replace: 'operator    User      @relation(fields: [operatorId], references: [id])'
    },
    {
        search: 'location    Location? @relation(fields: [locationId], references: [id]) @id @default(cuid())',
        replace: 'location    Location? @relation(fields: [locationId], references: [id])'
    },
    // RouteMachine model
    {
        search: 'route     Route    @relation(fields: [routeId], references: [id], onDelete: Cascade) @id @default(cuid())',
        replace: 'route     Route    @relation(fields: [routeId], references: [id], onDelete: Cascade)'
    },
    {
        search: 'machine   Machine  @relation(fields: [machineId], references: [id]) @id @default(cuid())',
        replace: 'machine   Machine  @relation(fields: [machineId], references: [id])'
    }
];

// Apply all fixes
fixes.forEach(fix => {
    schema = schema.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
});

// 5. Fix multiple @id attributes in models
const models = [
    'InventoryMovement',
    'ActionLog', 
    'Sale',
    'CashCollection',
    'Expense',
    'Income'
];

models.forEach(modelName => {
    // Find the model and fix multiple @id attributes
    const modelRegex = new RegExp(`model ${modelName}\\s*{([^}]+)}`, 'g');
    schema = schema.replace(modelRegex, (match, content) => {
        // Remove @id @default(cuid()) from non-id fields
        let fixedContent = content.replace(/(\w+Id\s+String[^@]*@map\([^)]+\))\s*@id\s*@default\(cuid\(\)\)/g, '$1');
        fixedContent = fixedContent.replace(/(transactionId\s+String\?[^@]*@map\([^)]+\))\s*@id\s*@default\(cuid\(\)\)/g, '$1');
        fixedContent = fixedContent.replace(/(paymentProvider\s+String\?[^@]*@map\([^)]+\))\s*@id\s*@default\(cuid\(\)\)/g, '$1');
        
        // Remove @id @default(cuid()) from relation fields
        fixedContent = fixedContent.replace(/(\w+\s+\w+[^@]*@relation\([^)]+\))\s*@id\s*@default\(cuid\(\)\)/g, '$1');
        
        return `model ${modelName} {${fixedContent}}`;
    });
});

// 6. Clean up any remaining duplicate @id attributes
schema = schema.replace(/(@id[^@\n]*)\s*@id/g, '$1');

// 7. Fix comment syntax that might be causing issues
schema = schema.replace(/\/\/ ([^@\n]*) @id @default\(cuid\(\)\)/g, '// $1');


fs.writeFileSync(schemaPath, schema);




const { execSync } = require('child_process');

try {
    execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
    
} catch (error) {
    console.error('❌ Error generating Prisma client:', error.message);
    process.exit(1);
}


