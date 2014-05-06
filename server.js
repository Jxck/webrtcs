// Express
var express = require('express')
  , http = require('http')
  , app = express();

app.use(express.static(__dirname + '/public'));

var server = http.createServer(app).listen(3000);
console.log('server start:', 3000);

// Socket.IO
var io = require('socket.io')
  , io = io.listen(server, { 'log level': 2 });

io.sockets.on('connection', function(socket) {

  socket.on('enter', function() {
    console.log('enter');
    socket.broadcast.emit('enter', { id: socket.id });
  });

  socket.on('offer', function(data) {
    console.log('offer', data);
    io.sockets.socket(data.to).emit('offer', { id: socket.id, offer: data.offer });
  });

  socket.on('answer', function(data) {
    console.log('answer', data);
    io.sockets.socket(data.to).emit('answer', { id: socket.id, ans: data.ans });
  });

  socket.on('ice', function(data) {
    console.log('ice', data);
    io.sockets.socket(data.to).emit('ice', { id: socket.id, ice: data.ice });
  });

  socket.on('disconnect', function(data) {
    socket.broadcast.emit('stop', true);
  });
});
