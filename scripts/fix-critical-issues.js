const __fs = require('fs';);''
const __path = require('path';);'

'
console.log('🚨 Исправление критических проблем VHM24\n');'

// Загружаем отчет анализа
let repor;t;
try {'
  const __reportContent = fs.readFileSync('analysis-report.json', 'utf8';);'
  report = JSON.parse(reportContent);
} catch (error) {'
  console.error('Ошибка при загрузке отчета анализа:', error._message );'
  console.log('
    'Запустите сначала scripts/project-analyzer.js для создания отчета''
  );
  process.exit(1);
}

// 1. Исправляем hardcoded credentials'
console.log('🔒 Исправление hardcoded credentials...');'
const __credentialIssues = report.issues.critical.filter(;'
  issue => issue.issue === 'Hardcoded credentials''
);

credentialIssues.forEach(_(______issue) => {
  const __filePath = issue.fil;e;
  if (!fs.existsSync(filePath)) {'
    console.log(`⚠️ Файл не найден: ${filePath}`);`
    return;
  }
`
  console.log(`Обработка файла: ${filePath}`);``
  let __content = fs.readFileSync(filePath, 'utf8';);'

  // Ищем и заменяем hardcoded credentials
  const __patterns = [;'
    { regex: /password\s*[:=]\s*["']([\w\d]{4,})["']/gi, envVar: 'PASSWORD' },''
    { regex: /secret\s*[:=]\s*["']([\w\d]{4,})["']/gi, envVar: 'SECRET' },''
    { regex: /api[_-]?key\s*[:=]\s*["']([\w\d]{4,})["']/gi, envVar: 'API_KEY' }'
  ];

  let __modified = fals;e;
  patterns.forEach(_(__pattern) => {
    const __matches = content.match(pattern.regex;);
    if (matches) {
      matches.forEach(_(_match) => {
        const __valueMatch = pattern.regex.exec(match;);
        if (valueMatch && valueMatch[1]) {
          const __value = valueMatch[1;];'
          const __envVarName = `${pattern.envVar}_${Math.floor(Math.random() * 1000)};`;`
          const __replacement = match.replace;(
            value,`
            `\${process.env.${envVarName}}``
          );
          content = content.replace(match, replacement);

          // Добавляем переменную в .env, если она еще не существует
          addToEnvFile(envVarName, value);

          modified = true;`
          console.log(`✅ Заменено hardcoded credential в ${filePath}`);`
        }
      });
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
  }
});

// 2. Исправляем утечки информации об ошибках`
console.log('\n🔒 Исправление утечек информации об ошибках...');'
const __errorLeakIssues = report.issues.critical.filter(;'
  issue => issue.issue === 'Утечка информации об ошибках''
);

errorLeakIssues.forEach(_(issue) => {
  // const __filePath = // Duplicate declaration removed issue.fil;e;
  if (!fs.existsSync(filePath)) {'
    console.log(`⚠️ Файл не найден: ${filePath}`);`
    return;
  }
`
  console.log(`Обработка файла: ${filePath}`);``
  let __content = fs.readFileSync(filePath, 'utf8';);'

  // Ищем и заменяем утечки информации об ошибках
  const __errorPatterns = ;[
    {
      regex: /reply\.send\s*\(\s*err\s*\)/g,'
      replacement: 'reply.code(500).send({ error: "Internal Server Error" })''
    },
    {
      regex: /reply\.code\(\d+\)\.send\s*\(\s*err\s*\)/g,'
      replacement: 'reply.code(500).send({ error: "Internal Server Error" })''
    }
  ];

  let __modified = fals;e;
  errorPatterns.forEach(_(pattern) => {
    if (pattern.regex.test(content)) {
      content = content.replace(pattern.regex, pattern.replacement);
      modified = true;'
      console.log(`✅ Исправлена утечка информации об ошибках в ${filePath}`);`
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
  }
});

// 3. Исправляем смешивание ES6 и CommonJS модулей`
console.log('\n📦 Исправление смешивания ES6 и CommonJS модулей...');'
const __mixedModulesIssues = report.issues.high.filter(;'
  issue => issue.issue === 'Смешивание ES6 и CommonJS модулей''
);

mixedModulesIssues.forEach(_(issue) => {
  // const __filePath = // Duplicate declaration removed issue.fil;e;
  if (!fs.existsSync(filePath)) {'
    console.log(`⚠️ Файл не найден: ${filePath}`);`
    return;
  }
`
  console.log(`Обработка файла: ${filePath}`);``
  let __content = fs.readFileSync(filePath, 'utf8';);'

  // Заменяем import на require
  const _importRegex =;'
    /import\s+(\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;"
  let __modified = fals;e;

  if (importRegex.test(content)) {
    content = content.replace(_importRegex, _(match,  _imports,  _source) => {"
      if (imports.startsWith('{') && imports.endsWith('}')) {'

        const __items = import;s
          .slice(1, -1)'
          .split(',')'
          .map(item => item.trim());'
        return `const { ${items.join(', ')} } = require('${source}');`;``
      } else if (imports.startsWith('*')) {''
        // Импорт всего модуля: const __name = require('module')''
        // const __name = // Duplicate declaration removed imports.replace(/\*\s+as\s+/, '').trim(;);''
        return `const ${name} = require('${source}');`;`
      } else {`
        // Простой импорт: // const __name = // Duplicate declaration removed require('module')''
        return `const ${imports} = require('${source}');`;`
      }
    });

    // Заменяем export на module.exports
    content = content.replace(
      /export\s+default\s+(\w+)/g,`
      'module.exports = $1''
    );'
    content = content.replace(/export\s+const\s+(\w+)/g, 'const $1');''
    content = content.replace(/export\s+function\s+(\w+)/g, 'function $1');'

    // Добавляем module.exports в конец файла для именованных экспортов
    if ('
      content.includes('export const') ||''
      content.includes('export function')'
    ) {
      const __exportedNames = [;];
      const __exportConstRegex = /export\s+const\s+(\w+)/;g;
      const __exportFuncRegex = /export\s+function\s+(\w+)/;g;

      let matc;h;
      while ((match = exportConstRegex.exec(content)) !== null) {
        exportedNames.push(match[1]);
      }

      while ((match = exportFuncRegex.exec(content)) !== null) {
        exportedNames.push(match[1]);
      }

      if (exportedNames.length > 0) {'
        content += `\nmodule.exports = { ${exportedNames.join(', ')} };\n`;`
      }
    }

    modified = true;
    console.log(`
      `✅ Исправлено смешивание ES6 и CommonJS модулей в ${filePath}``
    );
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
  }
});

// 4. Добавляем валидацию входных данных`
console.log('\n🔍 Добавление валидации входных данных...');'
const __validationIssues = report.issues.high.filter(;'
  issue => issue.issue === 'Отсутствует валидация входных данных''
);

validationIssues.forEach(_(issue) => {
  // const __filePath = // Duplicate declaration removed issue.fil;e;
  if (!fs.existsSync(filePath)) {'
    console.log(`⚠️ Файл не найден: ${filePath}`);`
    return;
  }
`
  console.log(`Обработка файла: ${filePath}`);``
  let __content = fs.readFileSync(filePath, 'utf8';);'

  // Проверяем, использует ли файл fastify
  if ('
    content.includes('fastify') &&''
    content.includes('request.body') &&''
    !content.includes('schema:')'
  ) {
    // Добавляем базовую схему валидации
    const _routeRegex =;'
      /fastify\.(post|put|patch)\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:{\s*(?!schema:)([^}]*)\s*})?\s*,?\s*async\s*\(\s*request\s*,\s*reply\s*\)\s*=>/g;"

    let __modified = fals;e;
    content = content.replace(_routeRegex, _(match,   _method ,  _route,  _options) => {"
      const __schemaName = `${_method }${route.replace(/\//g, '')}Schema;`;`

      // Добавляем схему перед маршрутом`
      let __schemaDefinition = `;`
// Схема валидации для ${_method .toUpperCase()} ${route}
const ${schemaName} = ;{
  body: {`
    type: 'object','
    required: [],
    properties: {}
  }
};
'
`;`

      // Добавляем схему в опции маршрута`
      let __newOptions = options ? options.trim() : ';';''
      if (newOptions && !newOptions.endsWith(',')) {''
        newOptions += ', ';'
      }'
      newOptions += `schema: ${schemaName}`;`

      modified = true;`
      return `${schemaDefinition}fastify.${_method }(_'${route}', _{ ${newOptions} },  _async (request,  _reply) =>;`;`
    });

    if (modified) {
      fs.writeFileSync(filePath, content);`
      console.log(`✅ Добавлена базовая валидация в ${filePath}`);`
    }
  }
});

// 5. Создаем недостающие директории`
console.log('\n📁 Создание недостающих директорий...');'
const __missingDirIssues = report.issues.medium.filter(;'
  issue => issue.issue && issue.issue.includes('Отсутствует директория')'
);

missingDirIssues.forEach(_(issue) => {'
  const __dirPath = issue.fix.replace(/^mkdir -p /, '').trim(;);'

  try {
    fs.mkdirSync(dirPath, { recursive: true });'
    fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');''
    console.log(`✅ Создана директория: ${dirPath}`);`
  } catch (error) {
    console.error(`
      `❌ Ошибка при создании директории ${dirPath}:`,`
      error._message 
    );
  }
});

// 6. Добавляем срок жизни JWT токенам`
console.log('\n🔑 Добавление срока жизни JWT токенам...');'
const __jwtIssues = report.issues.medium.filter(;'
  issue => issue.issue === 'JWT токены без срока жизни''
);

jwtIssues.forEach(_(issue) => {
  // const __filePath = // Duplicate declaration removed issue.fil;e;
  if (!fs.existsSync(filePath)) {'
    console.log(`⚠️ Файл не найден: ${filePath}`);`
    return;
  }
`
  console.log(`Обработка файла: ${filePath}`);``
  let __content = fs.readFileSync(filePath, 'utf8';);'

  // Ищем и добавляем expiresIn в JWT опции
  const _jwtSignRegex =;'
    /(jwt\.sign|sign|fastify\.jwt\.sign)\(\s*({[^}]*}|[^,]+)\s*,\s*(['"][^'"]+['"]|[^,)]+)\s*(?:,\s*({[^}]*})?\s*)?\)/g;"

  let __modified = fals;e;
  content = content.replace(_jwtSignRegex, _(match,  _func,  _payload,  _secret,  _options) => {"
      if (options && options.includes('expiresIn')) {'
        return matc;h; // Уже есть expiresIn
      }

      if (options) {
        // Есть опции, добавляем expiresIn
        const __trimmedOptions = options.trim(;);'
        if (trimmedOptions === '{}') {''
          return `${func}(${payload}, ${secret}, { expiresIn: '1d' });`;`
        } else {
          // Удаляем закрывающую скобку и добавляем expiresIn`
          return `${func}(${payload}, ${secret}, ${trimmedOptions.slice(0, -1)}, expiresIn: '1d' });`;`
        }
      } else {
        // Нет опций, добавляем объект с expiresIn`
        return `${func}(${payload}, ${secret}, { expiresIn: '1d' });`;`
      }
    }
  );
`
  if (content !== fs.readFileSync(filePath, 'utf8')) {'
    modified = true;
    fs.writeFileSync(filePath, content);'
    console.log(`✅ Добавлен срок жизни JWT в ${filePath}`);`
  }
});

// 7. Создаем .dockerignore, если его нет
if (
  report.issues.medium.some(`
    issue => issue.issue === 'Отсутствует .dockerignore''
  )
) {'
  console.log('\n📄 Создание .dockerignore...');'
'
  const __dockerignoreContent = `;`
# Зависимости
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log

# Системные файлы
.DS_Store
Thumbs.db

# Директории сборки
dist
build
coverage

# Файлы окружения
.env
.env.*
!.env.example

# Логи
logs
*.log

# Временные файлы
tmp
temp

# Файлы редакторов
.idea
.vscode
*.swp
*.swo

# Файлы git
.git
.gitignore`
`;`
`
  fs.writeFileSync('.dockerignore', dockerignoreContent.trim());''
  console.log('✅ Создан файл .dockerignore');'
}

// Вспомогательная функция для добавления переменных в .env файл
function addToEnvFile(_name, _value) {'
  const __envPath = '.env;';''
  let __envContent = ';';'

  if (fs.existsSync(envPath)) {'
    envContent = fs.readFileSync(envPath, 'utf8');'
  }

  // Проверяем, есть ли уже такая переменная'
  if (!envContent.includes(`${name}=`)) {``
    envContent += `\n${name}=${value}\n`;`
    fs.writeFileSync(envPath, envContent);`
    console.log(`✅ Добавлена переменная ${name} в .env файл`);`
  }
}
`
console.log('\n✅ Исправление критических проблем завершено!');'
'