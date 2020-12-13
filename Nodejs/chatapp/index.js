const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const emoji = require('node-emoji');

app.get('/', function(req, res) {
    res.render('index.ejs');
});

var users = new Map();

io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        if (username !== null && username !== undefined) {
            if (!username.replace(/\s/g, '').length) {
                io.emit('user_startup', 'Please enter a valid username:');
            } else if (users.has(username)) {
                io.emit('user_startup', 'Username is already taken. Please try another:');
            } else {
                socket.username = username;
                users.set(username, socket.id);
                io.emit('is_online', '🔵 <i>' + socket.username + ' has joined the chat.</i>');
            }
        }
    });

    socket.on('disconnect', function(username) {
        if (socket.username !== null && socket.username !== undefined) {
            users.delete(socket.username);
            io.emit('is_online', '🔴 <i>' + socket.username + ' has left the chat.</i>');
        }
    });

    socket.on('chat_message', function(message) {
        if (message === "/users") {
            var msg = 'Users Online: ';
            for (let username of users.keys()) {
                msg = msg + username + ', ';
            }
            msg = msg.substring(0,msg.length-2)+'.';
            socket.emit('chat_message', msg);
        } else if (message.substring(0,8) === "/whisper") {
            if (message === "/whisper") {
                socket.emit('chat_message', 'Correct usage is: /whisper <username> <message>');
            } else {
                aList = message.split(' ');
                if (aList.length < 3) {
                    socket.emit('chat_message', 'Correct usage is: /whisper <username> <message>'); 
                }
                var toUser = aList[1];
                if (!users.has(toUser)) {
                    socket.emit('chat_message', "User '" + toUser + "' is not online or does not exist.");
                } else {
                    var x = 10 + toUser.length;
                    var msg = message.substring(x,message.length);
                    if (msg === "") {
                        socket.emit('chat_message', 'Please enter a message to send.');
                    } else {
                        var toId = users.get(toUser);
                        if (toId === null || toId === undefined || toId < 0) {
                            socket.emit('chat_message', "There was an error sending the message to User '" + toUser + "'.");
                        } else {
                            socket.broadcast.to(toId).emit('chat_message', socket.username + " whispers: " + msg);
                            socket.emit('chat_message', "To " + toUser + ": " + msg);
                        }
                    }
                }
            }
        } else {
            message = emoji.emojify(message);
            io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
        }
    });

    socket.on('user_connected', function() {
        io.emit('user_startup', 'Enter your username:');
    });
});

const server = http.listen(8080, function() {
    console.log('Listening on *:8080');
});