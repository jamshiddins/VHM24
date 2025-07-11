module.exports = {
  // Основные настройки
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // Скобки и пробелы
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // Переносы строк
  endOfLine: 'lf',

  // Специфичные настройки для разных типов файлов
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always'
      }
    }
  ]
};
