// Pagination utilities

function createPagination(currentOffset, limit, total, prefix) {
  const currentPage = Math.floor(currentOffset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  
  const buttons = [];
  
  // Previous button
  if (currentPage > 1) {
    buttons.push({
      text: '◀️ Previous',
      callback_data: `${prefix}_page_${currentPage - 1}`
    });
  }
  
  // Page indicator
  buttons.push({
    text: `${currentPage}/${totalPages}`,
    callback_data: 'noop' // No operation
  });
  
  // Next button
  if (currentPage < totalPages) {
    buttons.push({
      text: 'Next ▶️',
      callback_data: `${prefix}_page_${currentPage + 1}`
    });
  }
  
  return buttons;
}

function parsePaginationCallback(callbackData) {
  const match = callbackData.match(/(.+)_page_(\d+)/);
  if (!match) return null;
  
  return {
    prefix: match[1],
    page: parseInt(match[2])
  };
}

function calculateOffset(page, limit) {
  return (page - 1) * limit;
}

function createNumberedList(items, offset = 0) {
  return items.map((item, index) => ({
    ...item,
    number: offset + index + 1
  }));
}

function createPageButtons(total, current, maxButtons = 5) {
  const buttons = [];
  let startPage = Math.max(1, current - Math.floor(maxButtons / 2));
  let endPage = Math.min(total, startPage + maxButtons - 1);
  
  // Adjust start if we're near the end
  if (endPage === total) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    buttons.push({
      text: i === current ? `• ${i} •` : String(i),
      callback_data: i === current ? 'noop' : `page_${i}`
    });
  }
  
  return buttons;
}

function splitIntoChunks(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function createAlphabeticalIndex(items, keyGetter = (item) => item.name) {
  const index = {};
  
  items.forEach(item => {
    const firstLetter = keyGetter(item).charAt(0).toUpperCase();
    if (!index[firstLetter]) {
      index[firstLetter] = [];
    }
    index[firstLetter].push(item);
  });
  
  // Sort each letter group
  Object.keys(index).forEach(letter => {
    index[letter].sort((a, b) => keyGetter(a).localeCompare(keyGetter(b)));
  });
  
  return index;
}

function createIndexButtons(index) {
  const letters = Object.keys(index).sort();
  const buttons = [];
  const buttonsPerRow = 6;
  
  for (let i = 0; i < letters.length; i += buttonsPerRow) {
    const row = letters.slice(i, i + buttonsPerRow).map(letter => ({
      text: `${letter} (${index[letter].length})`,
      callback_data: `index_${letter}`
    }));
    buttons.push(row);
  }
  
  return buttons;
}

module.exports = { createPagination, parsePaginationCallback, calculateOffset, createNumberedList, createPageButtons, splitIntoChunks, createAlphabeticalIndex, createIndexButtons };
