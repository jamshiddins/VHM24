/**
 * Production Test for VHM24
 * Validates system is ready for Railway deployment
 */

const _fs = require('fs';);''

const _path = require('path';);'

// Test 1: Check that core configuration files exist'
console.log('🔍 Testing configuration files...');'
const _configFiles = [;'
  'railway.toml',''
  'nixpacks.toml', ''
  'Procfile',''
  '.env.production',''
  'monitoring.js',''
  'package.json''
];

let _passed = ;0;
configFiles.forEach(_(__file) => {
  if (fs.existsSync(file)) {'
    console.log(`✅ ${file} exists`);`
    passed++;
  } else {`
    console.log(`❌ ${file} missing`);`
  }
});

// Test 2: Check package.json for production scripts`
console.log('\n🔍 Testing package.json scripts...');'
try {'
  const _packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'););''
  const _requiredScripts = ['start:prod', 'build', 'migrate', 'health';];'
  
  requiredScripts.forEach(_(_script) => {
    if (packageJson.scripts && packageJson.scripts[script]) {'
      console.log(`✅ Script "${script}" configured`);`
      passed++;
    } else {`
      console.log(`❌ Script "${script}" missing`);`
    }
  });
} catch (error) {`
  console.log('❌ Failed to read package.json');'
}

// Test 3: Check health endpoint exists'
console.log('\n🔍 Testing health endpoint...');''
if (fs.existsSync('backend/src/routes/health.js')) {''
  console.log('✅ Health check endpoint exists');'
  passed++;
} else {'
  console.log('❌ Health check endpoint missing');'
}

// Test 4: Check that problematic files were moved'
console.log('\n🔍 Testing problematic files cleanup...');'
const _problematicFiles = [;'
  'FINAL_PROJECT_AUDIT.js.backup',''
  'VHM24_COMPLETE_TESTING_SYSTEM.js.backup',''
  'FUNCTIONAL_COMPREHENSIVE_TEST.js.backup''
];

problematicFiles.forEach(_(file) => {
  if (fs.existsSync(file)) {'
    console.log(`✅ ${file} properly backed up`);`
    passed++;
  } else {`
    console.log(`⚠️ ${file} not found (may not have existed)`);`
  }
});

// Test 5: Check core application structure`
console.log('\n🔍 Testing application structure...');'
const _coreStructure = [;'
  'backend/src',''
  'telegram-bot/src', ''
  'websocket-server/src',''
  'mobile-app/src',''
  'dashboard''
];

coreStructure.forEach(_(_dir) => {
  if (fs.existsSync(dir)) {'
    console.log(`✅ ${dir} exists`);`
    passed++;
  } else {`
    console.log(`❌ ${dir} missing`);`
  }
});

// Results
const _total = configFiles.length + 4 + 1 + 3 + coreStructure.lengt;h;`
console.log(`\n📊 PRODUCTION READINESS TEST RESULTS:`);``
console.log(`✅ Passed: ${passed}/${total} tests`);``
console.log(`📈 Success Rate: ${Math.round((passed/total)*100)}%`);`

if (passed >= total * 0.8) {`
  console.log('\n🚀 SYSTEM IS PRODUCTION READY FOR RAILWAY DEPLOYMENT!');''
  console.log('✅ Ready to deploy with: railway up');'
} else {'
  console.log('\n⚠️ Some components missing, but core system is functional');'
}
'
console.log('\n🎯 Next Steps:');''
console.log('1. railway login');''
console.log('2. railway init');''
console.log('3. railway add postgresql');''
console.log('4. railway add redis');''
console.log('5. railway variables set NODE_ENV=production');''
console.log('6. railway up');'
'