const http = require('http');

const PORT = process.env.PORT || 8000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>VHM24 Platform</h1>
      <p>Status: Running</p>
      <p>Port: ${PORT}</p>
      <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    `);
  }
});

server.listen(PORT, () => {
  console.log(`VHM24 server running on port ${PORT}`);
});
