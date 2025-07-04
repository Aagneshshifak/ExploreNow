const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('ok'));
app.listen(8082, () => console.log('Express listening on 8082')); 