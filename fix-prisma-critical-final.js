#!/usr/bin/env node

const fs = require('fs');
const path = require('path');



const schemaPath = 'backend/prisma/schema.prisma';

if (!fs.existsSync(schemaPath)) {
    console.error('❌ Prisma schema not found!');
    process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');



// Remove duplicate @id attributes - only keep the first one
schema = schema.replace(/(\w+)\s+(\w+)\s+@id\s+@default\(cuid\(\)\)\s*\n([\s\S]*?)@id\s+@default\(cuid\(\)\)/g, 
    (match, type, name, content) => {
        // Remove all @id @default(cuid()) except the first one
        const cleanContent = content.replace(/@id\s+@default\(cuid\(\)\)/g, '');
        return `${type} ${name} @id @default(cuid())\n${cleanContent}`;
    });

// Fix specific models with multiple @id issues
const modelFixes = [
    // Hopper model - remove @id from foreign keys
    {
        search: /ingredientId\s+String\s+@map\("ingredient_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'ingredientId  String      @map("ingredient_id")'
    },
    {
        search: /machineId\s+String\?\s+@map\("machine_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'machineId     String?     @map("machine_id")'
    },
    {
        search: /bagId\s+String\?\s+@map\("bag_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'bagId         String?     @map("bag_id")'
    },
    // Bag model
    {
        search: /machineId\s+String\?\s+@map\("machine_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'machineId   String?   @map("machine_id")'
    },
    // Syrup model
    {
        search: /bottleId\s+String\s+@unique\s+@map\("bottle_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'bottleId    String      @unique @map("bottle_id")'
    },
    // WaterBottle model
    {
        search: /machineId\s+String\?\s+@map\("machine_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'machineId     String?           @map("machine_id")'
    },
    // Recipe model
    {
        search: /machineId\s+String\?\s+@map\("machine_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'machineId   String?   @map("machine_id")'
    },
    // RecipeItem model
    {
        search: /recipeId\s+String\s+@map\("recipe_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'recipeId     String     @map("recipe_id")'
    },
    {
        search: /ingredientId\s+String\s+@map\("ingredient_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'ingredientId String     @map("ingredient_id")'
    },
    // Route model
    {
        search: /operatorId\s+String\s+@map\("operator_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'operatorId  String    @map("operator_id")'
    },
    {
        search: /locationId\s+String\?\s+@map\("location_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'locationId  String?   @map("location_id")'
    },
    // RouteStop model
    {
        search: /routeId\s+String\s+@map\("route_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'routeId   String   @map("route_id")'
    },
    {
        search: /machineId\s+String\s+@map\("machine_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'machineId String   @map("machine_id")'
    },
    {
        search: /taskId\s+String\?\s+@map\("task_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'taskId    String?  @map("task_id")'
    },
    // HopperMovement model
    {
        search: /hopperId\s+String\s+@map\("hopper_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'hopperId    String    @map("hopper_id")'
    },
    {
        search: /userId\s+String\s+@map\("user_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'userId      String    @map("user_id")'
    },
    {
        search: /taskId\s+String\?\s+@map\("task_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'taskId      String?   @map("task_id")'
    },
    // WaterMovement model
    {
        search: /bottleId\s+String\s+@map\("bottle_id"\)\s+@id\s+@default\(cuid\(\)\)/g,
        replace: 'bottleId      String       @map("bottle_id")'
    }
];

// Apply all fixes
modelFixes.forEach(fix => {
    schema = schema.replace(fix.search, fix.replace);
});

// Remove duplicate MovementType enum
const movementTypeCount = (schema.match(/enum MovementType/g) || []).length;
if (movementTypeCount > 1) {
    
    // Find and remove the second occurrence
    const parts = schema.split('enum MovementType');
    if (parts.length > 2) {
        // Keep first occurrence, remove others
        const firstPart = parts[0] + 'enum MovementType' + parts[1];
        let remainingParts = parts.slice(2);
        
        // Remove the enum definition from subsequent parts
        remainingParts = remainingParts.map((part, index) => {
            if (index === 0) {
                // Remove the enum definition from the beginning
                return part.replace(/^[\s\S]*?}/, '');
            }
            return part;
        });
        
        schema = firstPart + remainingParts.join('');
    }
}

// Fix missing @relation attributes for Syrup and WaterBottle
schema = schema.replace(
    /machine\s+Machine\?\s+@relation$/gm,
    'machine     Machine?    @relation(fields: [machineId], references: [id])'
);

schema = schema.replace(
    /bag\s+Bag\?\s+@relation$/gm,
    'bag         Bag?        @relation(fields: [bagId], references: [id])'
);

schema = schema.replace(
    /user\s+User\s+@relation$/gm,
    'user          User         @relation(fields: [userId], references: [id])'
);


fs.writeFileSync(schemaPath, schema);




const { execSync } = require('child_process');

try {
    execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
    
} catch (error) {
    console.error('❌ Error generating Prisma client:', error.message);
    process.exit(1);
}


