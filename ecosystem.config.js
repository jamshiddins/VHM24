module.exports = {
  "apps": [
    {
      "name": "vhm24-auth",
      "script": "services/auth/src/index.js",
      "watch": false,
      "instances": 1,
      "autorestart": true,
      "max_memory_restart": "200M",
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "vhm24-machines",
      "script": "services/machines/src/index.js",
      "watch": false,
      "instances": 1,
      "autorestart": true,
      "max_memory_restart": "200M",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3002
      }
    },
    {
      "name": "vhm24-inventory",
      "script": "services/inventory/src/index.js",
      "watch": false,
      "instances": 1,
      "autorestart": true,
      "max_memory_restart": "200M",
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "vhm24-tasks",
      "script": "services/tasks/src/index.js",
      "watch": false,
      "instances": 1,
      "autorestart": true,
      "max_memory_restart": "200M",
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "vhm24-bunkers",
      "script": "services/bunkers/src/index.js",
      "watch": false,
      "instances": 1,
      "autorestart": true,
      "max_memory_restart": "200M",
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "vhm24-telegram-bot",
      "script": "services/telegram-bot/src/index.js",
      "watch": false,
      "instances": 1,
      "autorestart": true,
      "max_memory_restart": "200M",
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "vhm24-notifications",
      "script": "services/notifications/src/index.js",
      "watch": false,
      "instances": 1,
      "autorestart": true,
      "max_memory_restart": "200M",
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "vhm24-gateway",
      "script": "services/gateway/src/index.js",
      "watch": false,
      "instances": 1,
      "autorestart": true,
      "max_memory_restart": "200M",
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
