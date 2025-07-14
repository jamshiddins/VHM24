const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const response = {
        message: 'VHM24 Emergency Server',
        status: 'running',
        path: req.url,
        timestamp: new Date().toISOString(),
        port: PORT
    };
    
    res.end(JSON.stringify(response));
});

server.listen(PORT, '0.0.0.0', () => {
    
});
