/**
 * VHM24 Platform - Railway Entry Point (Gateway Only)
 * Simplified version that only runs the API Gateway
 */

// Load .env only in local development
if (!process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}

console.log('🚀 VHM24 Gateway starting on Railway...');
console.log('Project ID:', process.env.RAILWAY_PROJECT_ID || 'local');
console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'development');
console.log('Database:', process.env.DATABASE_URL ? 'Configured' : 'Not configured');
console.log('Port:', process.env.PORT || 8000);

// Start only the Gateway service
require('./services/gateway/src/index.js');
