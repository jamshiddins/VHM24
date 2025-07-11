# VHM24 Project Analysis Report

Generated: 10.07.2025, 14:41:21

## 📊 Summary

- **Files Analyzed**: 24
- **Total Issues**: 24
- **Critical**: 2
- **High**: 6
- **Medium**: 8
- **Low**: 8

## 🚨 Critical Issues

### CRITICAL Priority

1. **Утечка информации об ошибках**
   - File: `scripts\project-analyzer.js`
   - Line: 60
   - Fix: `reply.code(500).send({ error: "Internal Server Error" })`

2. **Утечка информации об ошибках**
   - File: `scripts\auto-fixer.js`
   - Line: 74
   - Fix: `reply.code(500).send({ error: "Internal Server Error" })`

### HIGH Priority

1. **Смешивание ES6 и CommonJS модулей**
   - File: `scripts\project-analyzer.js`
   - Fix: `Использовать только CommonJS (require/module.exports)`

2. **Смешивание ES6 и CommonJS модулей**
   - File: `scripts\auto-fixer.js`
   - Fix: `Использовать только CommonJS (require/module.exports)`

3. **findMany без пагинации**
   - File: `scripts\project-analyzer.js`
   - Fix: `Добавить skip/take параметры`

4. **Потенциальная N+1 проблема**
   - File: `scripts\project-analyzer.js`
   - Fix: `Использовать include или Promise.all`

5. **Потенциальная N+1 проблема**
   - File: `scripts\auto-fixer.js`
   - Fix: `Использовать include или Promise.all`

6. **Отсутствует CI/CD pipeline**
   - Fix: `Создать GitHub Actions workflow`

### MEDIUM Priority

1. **JWT токены без срока жизни**
   - File: `setup-error-fixing-system.js`
   - Fix: `Добавить expiresIn в JWT опции`

2. **Синхронные операции файловой системы**
   - File: `setup-error-fixing-system.js`
   - Fix: `Использовать асинхронные версии`

3. **Синхронные операции файловой системы**
   - File: `fix-all-errors.js`
   - Fix: `Использовать асинхронные версии`

4. **Синхронные операции файловой системы**
   - File: `scripts\test-after-fixes.js`
   - Fix: `Использовать асинхронные версии`

5. **Синхронные операции файловой системы**
   - File: `scripts\project-analyzer.js`
   - Fix: `Использовать асинхронные версии`

6. **Запросы по неиндексированным полям**
   - File: `scripts\project-analyzer.js`
   - Fix: `Добавить индексы в schema.prisma`

7. **Синхронные операции файловой системы**
   - File: `scripts\auto-fixer.js`
   - Fix: `Использовать асинхронные версии`

8. **Отсутствует .dockerignore**
   - Fix: `Создать .dockerignore файл`

### LOW Priority

1. **Использование console.log вместо logger**
   - File: `setup-error-fixing-system.js`
   - Fix: `Использовать структурированное логирование (pino/winston)`

2. **Магические числа в коде**
   - File: `setup-error-fixing-system.js`
   - Fix: `Вынести в константы`

3. **Использование console.log вместо logger**
   - File: `fix-all-errors.js`
   - Fix: `Использовать структурированное логирование (pino/winston)`

4. **Магические числа в коде**
   - File: `scripts\test-after-fixes.js`
   - Fix: `Вынести в константы`

5. **Использование console.log вместо logger**
   - File: `scripts\project-analyzer.js`
   - Fix: `Использовать структурированное логирование (pino/winston)`

6. **Использование console.log вместо logger**
   - File: `scripts\auto-fixer.js`
   - Fix: `Использовать структурированное логирование (pino/winston)`

7. **Магические числа в коде**
   - File: `scripts\auto-fixer.js`
   - Fix: `Вынести в константы`

8. **Использование console.log вместо logger**
   - File: `packages\shared\logger\index.js`
   - Fix: `Использовать структурированное логирование (pino/winston)`
