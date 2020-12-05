const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const emoji = require('node-emoji');

app.get('/', function(req, res) {
    res.render('index.ejs');
});

var users = new Set();

io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        if (username !== null && username !== undefined) {
            if (!username.replace(/\s/g, '').length) {
                io.emit('user_startup', 'Please enter a valid username:');
            } else if (users.has(username)) {
                io.emit('user_startup', 'Username is already taken. Please try another:');
            } else {
                socket.username = username;
                users.add(socket.username);
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
            for (let username of users) {
                msg = msg + username + ', ';
            }
            msg = msg.substring(0,msg.length-2)+'.';
            socket.emit('chat_message', msg);
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