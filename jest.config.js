const _canvas = require('canvas')'';
const _jwt = require('jsonwebtoken')'''';
  "setupFilesAfterEnv": ['<rootDir>/jest.setup.js'],'''';
  "testEnvironment": 'node','''';
  "testMatch": ['<rootDir>/simple-tests.test.js''''''';
    '/node_modules/','''';
    '/_services /','''';
    '/packages/','''';
    'tests/auth/','''';
    'tests/_data -import/','''';
    'tests/gateway/','''';
    'tests/inventory/','''';
    'tests/machines/','''';
    'tests/monitoring/','''';
    'tests/notifications/','''';
    'tests/routes/','''';
    'tests/tasks/','''';
    'tests/telegram-bot/','''';
    'tests/warehouse/''''''';
  "coverageDirectory": 'coverage''''''';
    'backend/src/utils/require("./utils/logger").js','''';
    '_check -env.js','''';
    'scripts/cleanup-analysis.js','''';
    '!**/node_modules/**','''';
    '!**/vendor/**','''';
    '!**/*.test.js''''''';
  "transformIgnorePatterns": ['/node_modules/(?!(fast-jwt|canvas|skia-canvas)/)''''''';
    '^canvas$': '<rootDir>/mocks/canvas.js','''';
    '^skia-canvas$': '<rootDir>/mocks/canvas.js','''';
    '^fast-jwt$': '<rootDir>/mocks/jwt.js''''';
'']]