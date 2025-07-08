// Читаем JSON из stdin и красиво выводим
let data = '';
process.stdin.on('data', chunk => {
  data += chunk;
});

process.stdin.on('end', () => {
  try {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.log(data);
  }
});
