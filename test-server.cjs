const http = require('http');
http.createServer((req, res) => res.end('ok')).listen(8081, () => console.log('listening on 8081')); 