/**
 * VHM24 - Prepare for Railway Deployment
 * This script prepares the project for Railway deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚂 Preparing VHM24 for Railway deployment...\n');

// Check if git is initialized
function checkGit() {
  console.log('📌 Checking Git status...');
  try {
    execSync('git status', { stdio: 'ignore' });
    console.log('✅ Git repository found');
  } catch (error) {
    console.log('❌ Git not initialized. Initializing...');
    execSync('git init');
    console.log('✅ Git initialized');
  }
}

// Create .gitignore if not exists
function createGitignore() {
  console.log('\n📌 Checking .gitignore...');
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = `# Dependencies
node_modules/
*/node_modules/

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs
lib-cov

# Coverage directory
coverage
*.lcov

# Build
dist/
build/
.next/
out/

# Misc
.DS_Store
.idea/
.vscode/
*.swp
*.swo
*~

# Database
*.sqlite
*.sqlite3
*.db

# Uploads
uploads/
public/uploads/

# OS
Thumbs.db
`;
    
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Created .gitignore');
  } else {
    console.log('✅ .gitignore exists');
  }
}

// Check required files
function checkRequiredFiles() {
  console.log('\n📌 Checking required files...');
  
  const requiredFiles = [
    { file: 'package.json', exists: false },
    { file: 'railway.json', exists: false },
    { file: 'index.js', exists: false },
    { file: '.env.railway', exists: false },
    { file: 'RAILWAY_DEPLOYMENT_GUIDE.md', exists: false }
  ];
  
  requiredFiles.forEach(item => {
    item.exists = fs.existsSync(path.join(process.cwd(), item.file));
    if (item.exists) {
      console.log(`✅ ${item.file} found`);
    } else {
      console.log(`❌ ${item.file} missing`);
    }
  });
  
  const allExist = requiredFiles.every(item => item.exists);
  if (!allExist) {
    console.log('\n⚠️  Some required files are missing!');
    process.exit(1);
  }
}

// Install dependencies
function installDependencies() {
  console.log('\n📌 Installing dependencies...');
  
  try {
    console.log('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('\nInstalling workspace dependencies...');
    execSync('npm install --workspaces', { stdio: 'inherit' });
    
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Generate Prisma client
function generatePrismaClient() {
  console.log('\n📌 Generating Prisma client...');
  
  try {
    execSync('npm run db:generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
    process.exit(1);
  }
}

// Create deployment checklist
function createChecklist() {
  console.log('\n📋 Deployment Checklist:\n');
  
  const checklist = [
    '1. Push code to GitHub repository',
    '2. Connect GitHub repo to Railway project',
    '3. Add PostgreSQL service in Railway',
    '4. Add Redis service in Railway',
    '5. Configure environment variables:',
    '   - JWT_SECRET (generate secure random string)',
    '   - TELEGRAM_BOT_TOKEN (from @BotFather)',
    '   - ADMIN_IDS (your Telegram ID)',
    '6. Deploy the application',
    '7. Run database migrations',
    '8. Test all endpoints',
    '9. Configure custom domain (optional)',
    '10. Set up monitoring'
  ];
  
  checklist.forEach(item => console.log(`   ${item}`));
}

// Show environment variables template
function showEnvTemplate() {
  console.log('\n🔐 Environment Variables for Railway:\n');
  
  const envVars = `# Copy these to Railway dashboard

# JWT Configuration
JWT_SECRET=<generate-64-char-random-string>
JWT_EXPIRES_IN=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=<your-bot-token>
ADMIN_IDS=<your-telegram-id>

# Service Configuration
NODE_ENV=production
PORT=${{PORT}}

# Database and Redis will be auto-configured by Railway
DATABASE_URL=\${{Postgres.DATABASE_URL}}
REDIS_URL=\${{Redis.REDIS_URL}}
`;
  
  console.log(envVars);
}

// Main execution
async function main() {
  try {
    checkGit();
    createGitignore();
    checkRequiredFiles();
    installDependencies();
    generatePrismaClient();
    
    console.log('\n✅ Project is ready for Railway deployment!\n');
    
    createChecklist();
    showEnvTemplate();
    
    console.log('\n📚 Next steps:');
    console.log('1. Review RAILWAY_DEPLOYMENT_GUIDE.md');
    console.log('2. Push to GitHub: git add . && git commit -m "Ready for Railway" && git push');
    console.log('3. Go to Railway dashboard: https://railway.app/project/9820e0f0-e39b-4719-9580-de68a0e3498f');
    console.log('\n🚂 Happy deploying!');
    
  } catch (error) {
    console.error('\n❌ Preparation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
