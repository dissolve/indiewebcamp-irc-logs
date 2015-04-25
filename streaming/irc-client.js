var irc = require('irc');
var WebSocketServer = require('ws').Server;
var escape_html = require('escape-html');

var port = 8092;

var wss = new WebSocketServer({port: port});

var irc_channel = '#indiewebcamp';

wss.on('connection', function(ws) {

  console.log("Got new WS connection");

  var client = null;
  var channel = null;
  var my_nick = null;

  ws.on('message', function(message) {
    console.log("WS client sent: "+message);

    if(client == null) {
      my_nick = message;
      
      client = new irc.Client('irc.freenode.net', my_nick, {
        autoConnect: false,
        debug: true,
        userName: my_nick,
        realName: my_nick,
        channels: [irc_channel]
      });

      client.addListener('error', function(message) {
        console.log("[error] ", message);
      });

      client.connect(function() {
        console.log("Connecting to IRC...");
      });

      client.addListener('registered', function(message){
        console.log("[registered] ", message);
        my_nick = message.args[0];
        ws.send(JSON.stringify({
          "type": "registered", 
          "nick": message.args[0],
          "description": "connected to IRC server, joining channel..."
        }));
      });

      client.addListener('join', function(channel, nick, message){
        console.log("[join] ", channel, nick, message);
        if(my_nick == nick) {
          ws.send(JSON.stringify({"type": "connected"}));
        }
      });

      client.addListener('kick', function(channel, nick, by, reason, message){
        console.log("[kick] ", channel, nick, by, reason, message);
        if(my_nick == nick) {
          ws.send(JSON.stringify({"type": "disconnected"}));
        }
      });

      client.addListener('kill', function(nick, reason, channels, message){
        console.log("[kill] ", nick, reason, channels, message);
        if(my_nick == nick) {
          ws.send(JSON.stringify({"type": "disconnected"}));
        }
      });
      
      client.addListener('pm', function(nick, text, message){
        console.log("[pm] ", nick, text, message);
        ws.send(JSON.stringify({"type": "pm", "nick": nick, "text": text}));
      });
      
      client.addListener('notice', function(nick, to, text, message){
        console.log("[notice] ", nick, to, text, message, " (my nick: "+my_nick+")");
        if(my_nick == to) {
          ws.send(JSON.stringify({"type": "notice", "text": escape_html(text), "nick": nick}));
        }
      });

      ws.on('close', function(){
        console.log('WS client disconnected');
        client.disconnect('web visitor disconnected');
      });
      ws.on('error', function(){
        console.log('WS client disconnected');
        client.disconnect('web visitor left because of an error');
      });

    } else {
      var data = JSON.parse(message);
      if(data && data.message) {
        var match;
        if(match=data.message.match(/^\/([a-z]+) ([^ ]+) (.+)/)) {
          if(match[1] == "me") {
            client.say(irc_channel, '\u0001ACTION '+match[2]+ ' ' + match[3] + '\u0001');
          } else if(match[1] == "msg") {
            client.say(match[2], match[3]);
          } else {
            ws.send(JSON.stringify({"type": "error", "description": "command not recognized"}));
          }
        } else {
          client.say(irc_channel, data.message);
        }
      }
    }

  });

});

console.log("WebSocket Server Listening on port "+port);

