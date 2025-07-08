const http = require('http');
const PORT = process.env.PORT || 8000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('VHM24 Running on Railway!');
}).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
