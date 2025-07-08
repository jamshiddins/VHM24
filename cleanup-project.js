/**
 * VHM24 Project Cleanup Script
 * Removes redundant files and organizes the project structure
 */

const fs = require('fs');
const path = require('path');

// Files to delete
const filesToDelete = [
  // Redundant documentation
  'RAILWAY_API_STATUS.md',
  'RAILWAY_BOT_FIX.md',
  'RAILWAY_BUILD_FIX.md',
  'RAILWAY_CORRECT_VARIABLES.md',
  'RAILWAY_DATABASE_FIX.md',
  'RAILWAY_DEPLOY_NOW.md',
  'RAILWAY_ENV_REQUIRED.md',
  'RAILWAY_ENV_SETUP.md',
  'RAILWAY_FINAL_CONFIG.md',
  'RAILWAY_FINAL_DEPLOY.md',
  'RAILWAY_FINAL_SETUP.md',
  'RAILWAY_FINAL_STATUS.md',
  'RAILWAY_FINAL_STEPS.md',
  'RAILWAY_FINAL_VARIABLES.md',
  'RAILWAY_FIX_CHECKLIST.md',
  'RAILWAY_GATEWAY_FIX.md',
  'RAILWAY_PORT_FIX.md',
  'RAILWAY_QUICK_DEPLOY.md',
  'RAILWAY_VARIABLES_FINAL.md',
  'RAILWAY_VARIABLES_READY.env',
  'RAILWAY_WITH_SUPABASE.md',
  'RAILWAY_ADMIN_SETUP.md',
  
  // Redundant start scripts
  'start-all-services-fixed.bat',
  'start-all-services.bat',
  'start-all.bat',
  'start-development.bat',
  'start-gateway-simple.bat',
  'start-services.bat',
  'start-with-supabase.bat',
  'deploy-railway-fixed.bat',
  'deploy-to-railway.bat',
  'deploy-to-railway.sh',
  
  // Old entry points (replaced by start.js)
  'index.js',
  'railway-start.js',
  
  // Other redundant files
  'index-gateway-only.js',
  'prepare-for-railway.js',
  'setup-railway-env.js',
  'format-json.js',
  'vendhub-api-example.js',
  'vendhub-bot-example.js',
  'vendbot-compatibility-report.json',
  '.env.railway',
  'railway.json',
  
  // Old analysis files
  'VENDBOT_MIGRATION_ANALYSIS.md',
  'VENDHUB_API_SPEC.md',
  'VENDHUB_ARCHITECTURE_DIAGRAM.md',
  'VENDHUB_ARCHITECTURE.md',
  'VENDHUB_MIGRATION_PLAN.md',
  'VENDHUB_PROJECT_SUMMARY.md',
  'VENDHUB_TELEGRAM_BOT_SPEC.md',
  'VENDHUB_TEST_REPORT.md',
  'VENDHUB_VS_VHM24_COMPARISON.md',
  'VHM24_FIXES_REPORT_2025.md',
  'VHM24_FIXES_REPORT.md',
  'VHM24_GAP_ANALYSIS.md',
  'VHM24_IMPLEMENTATION_REPORT.md',
  'FINAL_COMPATIBILITY_REPORT.md',
  'FULL_ANALYSIS_AND_FIXES.md',
  'ARCHITECTURE_REVIEW.md',
  'README_IMPROVEMENTS.md',
  'TEST_RESULTS.md'
];

// Files to keep and potentially merge
const filesToKeep = [
  'RAILWAY_DEPLOYMENT_GUIDE.md',
  'RAILWAY_DATABASE_SETUP.md',
  'DATABASE_MIGRATION_PLAN.md',
  'DATABASE_MIGRATION_SUMMARY.md',
  'SUPABASE_MIGRATION_GUIDE.md',
  'QUICK_START.md',
  'NEXT_STEPS.md',
  'README.md',
  'VHM24_ANALYSIS_AND_OPTIMIZATION.md'
];

console.log('🧹 VHM24 Project Cleanup\n');

// Count files before cleanup
const totalFilesBefore = fs.readdirSync('.').length;
console.log(`Total files before cleanup: ${totalFilesBefore}`);

// Delete files
let deletedCount = 0;
let errors = [];

console.log('\n📁 Deleting redundant files...\n');

filesToDelete.forEach(file => {
  const filePath = path.join('.', file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted: ${file}`);
      deletedCount++;
    } catch (error) {
      console.error(`❌ Error deleting ${file}: ${error.message}`);
      errors.push({ file, error: error.message });
    }
  } else {
    console.log(`⏭️  Skipped (not found): ${file}`);
  }
});

// Summary
console.log('\n📊 Cleanup Summary:');
console.log(`- Files deleted: ${deletedCount}`);
console.log(`- Files kept: ${filesToKeep.length}`);
console.log(`- Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n❌ Errors encountered:');
  errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
}

// Count files after cleanup
const totalFilesAfter = fs.readdirSync('.').length;
console.log(`\nTotal files after cleanup: ${totalFilesAfter}`);
console.log(`Files removed: ${totalFilesBefore - totalFilesAfter}`);

console.log('\n✨ Cleanup complete!');
console.log('\n📝 Next steps:');
console.log('1. Review the remaining documentation files');
console.log('2. Merge related documentation into single files');
console.log('3. Update README.md with current project structure');
console.log('4. Run "npm run clean && npm install" to refresh dependencies');
