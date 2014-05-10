// Express
var express = require('express')
  , http = require('http')
  , app = express();

app.use(express.static(__dirname + '/public'));

var server = http.createServer(app).listen(3000);
console.log('server start:', 3000);

// Socket.IO
var io = require('socket.io')
  , io = io.listen(server);

io.sockets.on('connection', function(socket) {
  socket.on('offer', function(data) {
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', function(data) {
    socket.broadcast.emit('answer', data);
  });

  socket.on('ice', function(data) {
    console.log('ice', data);
    socket.broadcast.emit('ice', data);
  });

  socket.on('disconnect', function(data) {
    socket.broadcast.emit('stop', true);
  });
});
