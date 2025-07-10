/**
 * VHM24 Pagination Utility
 * Утилиты для пагинации данных
 */

/**
 * Создание параметров пагинации для Prisma
 */
const createPaginationParams = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Максимум 100 записей
  
  const skip = (pageNum - 1) * limitNum;
  
  return {
    skip,
    take: limitNum,
    page: pageNum,
    limit: limitNum
  };
};

/**
 * Создание метаданных пагинации
 */
const createPaginationMeta = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Создание полного ответа с пагинацией
 */
const createPaginatedResponse = (data, totalCount, page, limit, additionalMeta = {}) => {
  const meta = createPaginationMeta(totalCount, page, limit);
  
  return {
    data,
    meta: {
      ...meta,
      ...additionalMeta
    }
  };
};

/**
 * Middleware для автоматической пагинации
 */
const paginationMiddleware = (defaultLimit = 20, maxLimit = 100) => {
  return async (request, reply) => {
    try {
      const page = Math.max(1, parseInt(request.query.page, 10) || 1);
      const limit = Math.min(maxLimit, Math.max(1, parseInt(request.query.limit, 10) || defaultLimit));
      
      // Добавляем параметры пагинации в request
      request.pagination = createPaginationParams(page, limit);
      
      // Добавляем helper функцию для создания ответа
      request.createPaginatedResponse = (data, totalCount, additionalMeta = {}) => {
        try {
          return createPaginatedResponse(data, totalCount, page, limit, additionalMeta);
        } catch (error) {
          console.error('Error:', error);
          throw error;
        }
      };
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
};

/**
 * Утилита для пагинации массивов (для случаев когда нельзя использовать БД пагинацию)
 */
const paginateArray = (array, page = 1, limit = 20) => {
  const { skip, take } = createPaginationParams(page, limit);
  const totalCount = array.length;
  const data = array.slice(skip, skip + take);
  
  return createPaginatedResponse(data, totalCount, page, limit);
};

/**
 * Создание параметров сортировки для Prisma
 */
const createSortParams = (sortBy, sortOrder = 'desc', allowedFields = []) => {
  // Проверяем разрешенные поля для сортировки
  if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    sortBy = allowedFields[0]; // Используем первое разрешенное поле по умолчанию
  }
  
  if (!sortBy) {
    return { createdAt: 'desc' }; // Сортировка по умолчанию
  }
  
  const order = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';
  
  return { [sortBy]: order };
};

/**
 * Комбинированная утилита для пагинации и сортировки
 */
const createQueryParams = (query = {}, allowedSortFields = []) => {
  const { page, limit, sortBy, sortOrder, ...filters } = query;
  
  const pagination = createPaginationParams(page, limit);
  const sorting = createSortParams(sortBy, sortOrder, allowedSortFields);
  
  return {
    ...pagination,
    orderBy: sorting,
    filters
  };
};

/**
 * Middleware для валидации параметров пагинации
 */
const validatePaginationParams = (maxLimit = 100) => {
  return async (request, reply) => {
    try {
      const { page, limit } = request.query;
      
      // Валидация page
      if (page !== undefined) {
        const pageNum = parseInt(page, 10);
        if (isNaN(pageNum) || pageNum < 1) {
          return reply.code(400).send({
            error: 'Validation Error',
            message: 'Page must be a positive integer',
            statusCode: 400
          });
        }
      }
      
      // Валидация limit
      if (limit !== undefined) {
        const limitNum = parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > maxLimit) {
          return reply.code(400).send({
            error: 'Validation Error',
            message: `Limit must be between 1 and ${maxLimit}`,
            statusCode: 400
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
};

/**
 * Создание ссылок для пагинации (для REST API)
 */
const createPaginationLinks = (baseUrl, page, limit, totalPages) => {
  const createUrl = (pageNum) => {
    const url = new URL(baseUrl);
    url.searchParams.set('page', pageNum.toString());
    url.searchParams.set('limit', limit.toString());
    return url.toString();
  };
  
  const links = {
    self: createUrl(page),
    first: createUrl(1),
    last: createUrl(totalPages)
  };
  
  if (page > 1) {
    links.prev = createUrl(page - 1);
  }
  
  if (page < totalPages) {
    links.next = createUrl(page + 1);
  }
  
  return links;
};

/**
 * Cursor-based пагинация (для больших датасетов)
 */
const createCursorPagination = (cursor, limit = 20, direction = 'forward') => {
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  
  const params = {
    take: direction === 'forward' ? limitNum : -limitNum
  };
  
  if (cursor) {
    params.cursor = { id: cursor };
    params.skip = 1; // Пропускаем сам cursor
  }
  
  return params;
};

/**
 * Создание ответа для cursor-based пагинации
 */
const createCursorResponse = (data, hasMore = false, additionalMeta = {}) => {
  const response = {
    data,
    meta: {
      hasMore,
      count: data.length,
      ...additionalMeta
    }
  };
  
  // Добавляем cursors если есть данные
  if (data.length > 0) {
    response.meta.startCursor = data[0].id;
    response.meta.endCursor = data[data.length - 1].id;
  }
  
  return response;
};

/**
 * Утилита для поиска с пагинацией
 */
const createSearchParams = (searchQuery, searchFields = [], page = 1, limit = 20) => {
  const pagination = createPaginationParams(page, limit);
  
  let where = {};
  
  if (searchQuery && searchFields.length > 0) {
    where = {
      OR: searchFields.map(field => ({
        [field]: {
          contains: searchQuery,
          mode: 'insensitive'
        }
      }))
    };
  }
  
  return {
    ...pagination,
    where
  };
};

/**
 * Агрегация данных для пагинации (например, для дашбордов)
 */
const createAggregatedPagination = async (model, aggregateFields = [], page = 1, limit = 20, where = {}) => {
  try {
    const { skip, take } = createPaginationParams(page, limit);
    
    // Получаем общее количество
    const totalCount = await model.count({ where });
    
    // Получаем агрегированные данные
    const aggregateData = await model.aggregate({
      where,
      _count: { _all: true },
      ...aggregateFields.reduce((acc, field) => {
        acc[`_${field.type}`] = { [field.field]: true };
        return acc;
      }, {})
    });
    
    // Получаем данные с пагинацией
    const data = await model.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      data,
      meta: createPaginationMeta(totalCount, page, limit),
      aggregates: aggregateData
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

module.exports = {
  // Основные функции пагинации
  createPaginationParams,
  createPaginationMeta,
  createPaginatedResponse,
  paginateArray,
  
  // Сортировка
  createSortParams,
  createQueryParams,
  
  // Middleware
  paginationMiddleware,
  validatePaginationParams,
  
  // REST API утилиты
  createPaginationLinks,
  
  // Cursor-based пагинация
  createCursorPagination,
  createCursorResponse,
  
  // Поиск
  createSearchParams,
  
  // Агрегация
  createAggregatedPagination
};
