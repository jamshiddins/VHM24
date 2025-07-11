module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: ['eslint:recommended', 'plugin:node/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['node'],
  rules: {
    // Основные правила
    'no-console': 'off', // Разрешаем console в check-env.js
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'no-process-exit': 'off', // Разрешаем process.exit в CLI скриптах

    // Node.js специфичные правила
    'node/no-unpublished-require': 'off',
    'node/no-missing-require': 'off',
    'node/no-extraneous-require': 'off',
    'node/no-unsupported-features/es-syntax': 'off', // Разрешаем современный JS
    'node/shebang': 'off',

    // Стиль кода
    indent: ['error', 2],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    curly: 'off', // Отключаем обязательные скобки

    // Безопасность
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Лучшие практики
    eqeqeq: ['error', 'always'],
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'no-prototype-builtins': 'off',
    'no-inner-declarations': 'off',
    'no-const-assign': 'error',
    'no-useless-escape': 'off'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'logs/',
    '*.min.js',
    'prisma/migrations/',
    'apps/',
    'services/',
    'packages/',
    'tests/',
    'deploy/',
    'backups/',
    'mocks/',
    'test-files/',
    'vhm24-error-fixing-system-2025-07-10/',
    '*.backup.*',
    'cleanup-project.js',
    'create-*.js',
    'deploy-*.js',
    'fix-*.js',
    'migrate-*.js',
    'quick-*.js',
    'restart-*.js',
    'setup-*.js',
    'start-*.js',
    'test-*.js',
    'update-*.js',
    'railway-*.js',
    'monitor-*.js',
    'vhm24-*.js',
    '*.test.js'
  ]
};
