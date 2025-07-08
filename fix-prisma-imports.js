/**
 * VHM24 - Fix Prisma Imports Script
 * Replaces direct @prisma/client imports with centralized database clients
 */

const fs = require('fs');
const path = require('path');

// Service to client mapping
const serviceClientMap = {
  'auth': 'getAuthClient',
  'machines': 'getMachinesClient',
  'inventory': 'getInventoryClient',
  'tasks': 'getTasksClient',
  'bunkers': 'getSharedClient', // Bunkers uses shared client
  'gateway': 'getPrismaClient', // Gateway uses main client
  'telegram-bot': 'getPrismaClient' // Bot uses main client
};

// Files to check and fix
const servicePaths = [
  'services/machines/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/bunkers/src/index.js',
  'services/telegram-bot/src/index.js',
  'services/telegram-bot/src/handlers/inventoryHandler.js',
  'services/telegram-bot/src/handlers/machinesHandler.js',
  'services/telegram-bot/src/handlers/tasksHandler.js',
  'services/telegram-bot/src/handlers/reportsHandler.js',
  'services/telegram-bot/src/utils/auth.js'
];

console.log('🔧 Fixing Prisma imports in VHM24 services...\n');

let fixedCount = 0;
let errorCount = 0;

servicePaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipped (not found): ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Determine which client to use based on service
    const serviceName = filePath.split('/')[1];
    const clientFunction = serviceClientMap[serviceName] || 'getPrismaClient';
    
    // Pattern to match Prisma imports
    const prismaImportPattern = /const\s*{\s*PrismaClient\s*}\s*=\s*require\s*\(\s*['"]@prisma\/client['"]\s*\)\s*;?\s*\n\s*const\s+(\w+)\s*=\s*new\s+PrismaClient\s*\(\s*\)\s*;?/g;
    const simplePrismaPattern = /const\s+(\w+)\s*=\s*new\s+PrismaClient\s*\(\s*\)\s*;?/g;
    
    // Check if file has direct Prisma import
    if (content.includes('@prisma/client') || content.includes('new PrismaClient')) {
      // Replace the import and instantiation
      content = content.replace(prismaImportPattern, (match, varName) => {
        return `const { ${clientFunction} } = require('@vhm24/database');\nconst ${varName} = ${clientFunction}();`;
      });
      
      // Also handle cases where PrismaClient might be imported elsewhere
      if (content.includes("require('@prisma/client')")) {
        content = content.replace(
          /const\s*{\s*PrismaClient\s*}\s*=\s*require\s*\(\s*['"]@prisma\/client['"]\s*\)\s*;?/g,
          `const { ${clientFunction} } = require('@vhm24/database');`
        );
        
        content = content.replace(simplePrismaPattern, (match, varName) => {
          return `const ${varName} = ${clientFunction}();`;
        });
      }
      
      // If content changed, write it back
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath} (using ${clientFunction})`);
        fixedCount++;
      } else {
        console.log(`ℹ️  Already fixed or no changes needed: ${filePath}`);
      }
    } else {
      console.log(`✓ No Prisma imports found: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    errorCount++;
  }
});

console.log('\n📊 Summary:');
console.log(`- Files fixed: ${fixedCount}`);
console.log(`- Errors: ${errorCount}`);
console.log(`- Total files checked: ${servicePaths.length}`);

if (fixedCount > 0) {
  console.log('\n⚠️  Important: Make sure to run "npm install" in the root directory to ensure all dependencies are installed.');
}

console.log('\n✨ Prisma import fix complete!');
