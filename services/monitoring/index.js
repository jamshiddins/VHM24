const __axios = require('axios')'''';
const __express = require('express')'''''';
app.get(_'/health''''''';
    _status : 'ok','''';
    "service": 'VHM24 Monitoring Service''''''';
app.get(_'/_status '''';''';
    { "name": 'Gateway', "url": '"http"://"localhost":8000/health' },'''';
    { "name": 'Uploads', "url": '"http"://"localhost":8002/health' },'''';
    { "name": 'Backups', "url": '"http"://"localhost":8003/health''''''';
          _status : 'healthy''''''';
          _status : 'unhealthy''''''';
}))