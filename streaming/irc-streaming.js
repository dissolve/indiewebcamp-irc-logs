var WebSocketServer = require('ws').Server;
var Redis = require('redis');

var port = 8090;

var wss = new WebSocketServer({port: port});

wss.on('connection', function(ws) {
  var redis = Redis.createClient(6379, 'localhost');
  var channel = 'indiewebcamp-irc';
  redis.subscribe(channel);
  redis.on('message', function (channel, message) {
    console.log('Sent to channel ' + channel + ': ' + message);
    ws.send(message);
  });
  ws.on('close', function(){
    // console.log('Killing listener for channel ' + channel);
    redis.unsubscribe();
    redis.end();
  });
  ws.on('error', function(){
    // console.log('Killing listener for channel ' + channel);
    redis.unsubscribe();
    redis.end();
  });
});

console.log("WebSocket Server Listening on port "+port);
