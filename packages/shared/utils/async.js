/**
 * Утилиты для работы с асинхронными операциями
 * @module @vhm24/shared/utils/async
 */

/**
 * Выполняет несколько промисов с обработкой ошибок
 * @param {Promise[]} promises - Массив промисов
 * @returns {Promise<{status: string, value?: any, reason?: any}[]>} Результаты выполнения
 */
async function safePromiseAll(promises) {
  return Promise.allSettled(promises);
}

/**
 * Добавляет таймаут к промису
 * @param {Promise} promise - Промис
 * @param {number} ms - Таймаут в миллисекундах
 * @param {string} errorMessage - Сообщение об ошибке
 * @returns {Promise} Промис с таймаутом
 */
function withTimeout(promise, ms = 5000, errorMessage = 'Operation timed out') {
  const timeout = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(errorMessage));
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Выполняет функцию с повторными попытками
 * @param {Function} fn - Функция, возвращающая промис
 * @param {Object} options - Опции
 * @param {number} options.retries - Количество повторных попыток
 * @param {number} options.delay - Задержка между попытками в мс
 * @param {Function} options.onRetry - Функция, вызываемая при повторной попытке
 * @returns {Promise} Результат выполнения функции
 */
async function retry(fn, { retries = 3, delay = 1000, onRetry = () => {} } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < retries) {
        onRetry(error, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Выполняет функцию с мемоизацией результата
 * @param {Function} fn - Функция для мемоизации
 * @param {Function} keyFn - Функция для генерации ключа кэша
 * @param {number} ttl - Время жизни кэша в мс
 * @returns {Function} Мемоизированная функция
 */
function memoize(fn, keyFn = (...args) => JSON.stringify(args), ttl = 60000) {
  const cache = new Map();
  
  return async function(...args) {
    const key = keyFn(...args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }
    
    const result = await fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });
    
    return result;
  };
}

/**
 * Выполняет функцию с ограничением количества одновременных вызовов
 * @param {Function} fn - Функция для ограничения
 * @param {number} limit - Максимальное количество одновременных вызовов
 * @returns {Function} Функция с ограничением
 */
function throttle(fn, limit = 5) {
  const queue = [];
  let activeCount = 0;
  
  const executeNext = async () => {
    if (queue.length === 0 || activeCount >= limit) return;
    
    activeCount++;
    const { args, resolve, reject } = queue.shift();
    
    try {
      const result = await fn(...args);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      activeCount--;
      executeNext();
    }
  };
  
  return function(...args) {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });
      executeNext();
    });
  };
}

/**
 * Выполняет функцию с ограничением частоты вызовов
 * @param {Function} fn - Функция для ограничения
 * @param {number} wait - Минимальный интервал между вызовами в мс
 * @returns {Function} Функция с ограничением
 */
function debounce(fn, wait = 300) {
  let timeout;
  
  return function(...args) {
    clearTimeout(timeout);
    
    return new Promise(resolve => {
      timeout = setTimeout(() => {
        const result = fn(...args);
        resolve(result);
      }, wait);
    });
  };
}

module.exports = {
  safePromiseAll,
  withTimeout,
  retry,
  memoize,
  throttle,
  debounce
};
