#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');



const backend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
});

backend.on('close', (code) => {
    
});
