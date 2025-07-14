module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    'no-console': 'off',
    'no-undef': 'off' // Временно отключаем для заглушек
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    '*.backup',
    'dist/',
    'build/'
  ]
};
