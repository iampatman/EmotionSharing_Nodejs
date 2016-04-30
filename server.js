var connect = require('connect');
var http = require('http');

var app = connect();

// respond to all requests
app.use(function(req, res){
  res.end('Hello from Connect!\n');
  console.log('request received')
});

//create node.js http server and listen on port
http.createServer(app).listen(process.env.PORT || 3000);

