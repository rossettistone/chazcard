var express = require('express');
var fs = require('fs');

var app = express();

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname+'/public'));

app.get('/', function (req, res) {
  console.log('Serving index.html');
  res.sendfile(__dirname+'/public/index.html');
});

var server = app.listen(app.get('port'));
console.log('Server started on port', app.get('port'));
