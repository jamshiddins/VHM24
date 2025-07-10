# Инструкции по запуску в PowerShell

## Проблема

При попытке запустить `.bat` файлы в PowerShell возникает ошибка:

```
run-all-fixes.bat: The term 'run-all-fixes.bat' is not recognized as a name of a cmdlet, function, script file, or executable program.
```

Это происходит потому что PowerShell по умолчанию не запускает файлы из текущей директории без указания пути.

## Решение

Для вашего удобства созданы PowerShell скрипты (`.ps1`), которые можно запускать напрямую:

### Вариант 1: Запуск всех исправлений

```powershell
# Запуск всех исправлений и запуск в Docker
./run-all-fixes.ps1
```

### Вариант 2: Только запуск в Docker

```powershell
# Только запуск в Docker
./run-docker.ps1
```

### Вариант 3: Запуск .bat файлов

Если вы все же хотите использовать `.bat` файлы в PowerShell, добавьте `./` перед именем файла:

```powershell
# Запуск .bat файла в PowerShell
./run-all-fixes.bat
```

## Дополнительные команды

### Запуск отдельных скриптов исправления

```powershell
# Исправление импортов fast-jwt
node scripts/fix-fast-jwt.js

# Исправление импортов canvas
node scripts/fix-canvas.js

# Исправление тестов
node scripts/fix-dependencies.js
```

### Запуск проекта без Docker

```powershell
# Запуск проекта напрямую
node start-optimized.js
```

## Примечание

PowerShell скрипты (`.ps1`) могут требовать изменения политики выполнения. Если вы получаете ошибку о том, что выполнение скриптов отключено, выполните следующую команду в PowerShell с правами администратора:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Это позволит запускать локальные скрипты без цифровой подписи.
