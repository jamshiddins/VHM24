module.exports = {
  apps: [
    {
      name: 'vhm24-backend',
      script: 'backend/src/index.js',
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
