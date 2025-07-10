/**
 * Утилиты для работы с пагинацией
 * @module @vhm24/shared/utils/pagination
 */

/**
 * Создает объект пагинации для Prisma
 * @param {Object} options - Опции пагинации
 * @param {number} options.page - Номер страницы (начиная с 1)
 * @param {number} options.pageSize - Размер страницы
 * @returns {Object} Объект пагинации для Prisma
 */
function createPagination({ page = 1, pageSize = 20 } = {}) {
  // Проверка и приведение параметров к числам
  const parsedPage = parseInt(page, 10);
  const parsedPageSize = parseInt(pageSize, 10);
  
  // Валидация параметров
  const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const validPageSize = isNaN(parsedPageSize) || parsedPageSize < 1 ? 20 : 
                        parsedPageSize > 100 ? 100 : parsedPageSize;
  
  const skip = (validPage - 1) * validPageSize;
  
  return {
    skip,
    take: validPageSize
  };
}

/**
 * Форматирует результат запроса с пагинацией
 * @param {Array} items - Элементы текущей страницы
 * @param {number} total - Общее количество элементов
 * @param {Object} options - Опции пагинации
 * @param {number} options.page - Номер страницы (начиная с 1)
 * @param {number} options.pageSize - Размер страницы
 * @returns {Object} Отформатированный результат с метаданными пагинации
 */
function formatPaginatedResult(items, total, { page = 1, pageSize = 20 } = {}) {
  // Проверка и приведение параметров к числам
  const parsedPage = parseInt(page, 10);
  const parsedPageSize = parseInt(pageSize, 10);
  
  // Валидация параметров
  const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const validPageSize = isNaN(parsedPageSize) || parsedPageSize < 1 ? 20 : 
                        parsedPageSize > 100 ? 100 : parsedPageSize;
  
  const totalPages = Math.ceil(total / validPageSize);
  
  return {
    items,
    meta: {
      page: validPage,
      pageSize: validPageSize,
      total,
      totalPages,
      hasNextPage: validPage < totalPages,
      hasPrevPage: validPage > 1
    }
  };
}

/**
 * Создает объект для сортировки Prisma
 * @param {Object} options - Опции сортировки
 * @param {string} options.sortBy - Поле для сортировки
 * @param {string} options.sortOrder - Порядок сортировки (asc или desc)
 * @param {Array} options.allowedFields - Разрешенные поля для сортировки
 * @returns {Object} Объект сортировки для Prisma
 */
function createSorting({ sortBy = 'createdAt', sortOrder = 'desc', allowedFields = [] } = {}) {
  // Проверка, что поле сортировки разрешено
  const validSortBy = allowedFields.length > 0 && !allowedFields.includes(sortBy) 
    ? allowedFields[0] 
    : sortBy;
  
  // Проверка порядка сортировки
  const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) 
    ? sortOrder.toLowerCase() 
    : 'desc';
  
  return {
    orderBy: {
      [validSortBy]: validSortOrder
    }
  };
}

/**
 * Создает объект фильтрации для Prisma
 * @param {Object} filters - Объект с фильтрами
 * @param {Object} schema - Схема фильтрации
 * @returns {Object} Объект фильтрации для Prisma
 */
function createFilters(filters = {}, schema = {}) {
  const where = {};
  
  // Обрабатываем каждый фильтр согласно схеме
  Object.entries(filters).forEach(([key, value]) => {
    // Пропускаем пустые значения
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // Проверяем, что ключ есть в схеме
    if (!schema[key]) {
      return;
    }
    
    const { field, operator, transform } = schema[key];
    
    // Применяем трансформацию, если она указана
    const transformedValue = transform ? transform(value) : value;
    
    // Создаем фильтр в зависимости от оператора
    switch (operator) {
      case 'equals':
        where[field] = { equals: transformedValue };
        break;
      case 'contains':
        where[field] = { contains: transformedValue, mode: 'insensitive' };
        break;
      case 'startsWith':
        where[field] = { startsWith: transformedValue };
        break;
      case 'endsWith':
        where[field] = { endsWith: transformedValue };
        break;
      case 'in':
        where[field] = { in: Array.isArray(transformedValue) ? transformedValue : [transformedValue] };
        break;
      case 'gt':
        where[field] = { gt: transformedValue };
        break;
      case 'gte':
        where[field] = { gte: transformedValue };
        break;
      case 'lt':
        where[field] = { lt: transformedValue };
        break;
      case 'lte':
        where[field] = { lte: transformedValue };
        break;
      case 'between':
        if (Array.isArray(transformedValue) && transformedValue.length === 2) {
          where[field] = { 
            gte: transformedValue[0],
            lte: transformedValue[1]
          };
        }
        break;
      default:
        where[field] = transformedValue;
    }
  });
  
  return { where };
}

/**
 * Создает middleware для обработки пагинации, сортировки и фильтрации
 * @param {Object} options - Опции
 * @param {Array} options.allowedSortFields - Разрешенные поля для сортировки
 * @param {Object} options.filterSchema - Схема фильтрации
 * @returns {Function} Middleware функция
 */
function paginationMiddleware({ allowedSortFields = [], filterSchema = {} } = {}) {
  return (req, reply, done) => {
    // Извлекаем параметры пагинации из запроса
    const { page, pageSize, sortBy, sortOrder, ...filters } = req.query;
    
    // Создаем объекты пагинации и сортировки
    const pagination = createPagination({ page, pageSize });
    const sorting = createSorting({ sortBy, sortOrder, allowedFields: allowedSortFields });
    const filtering = createFilters(filters, filterSchema);
    
    // Добавляем параметры в запрос
    req.pagination = pagination;
    req.sorting = sorting;
    req.filtering = filtering;
    
    // Добавляем функцию форматирования результата
    req.formatPaginatedResult = (items, total) => 
      formatPaginatedResult(items, total, { page, pageSize });
    
    done();
  };
}

module.exports = {
  createPagination,
  formatPaginatedResult,
  createSorting,
  createFilters,
  paginationMiddleware
};
