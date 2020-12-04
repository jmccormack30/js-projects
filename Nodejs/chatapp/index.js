const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.render('index.ejs');
});

var users = new Set();

io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        if (username !== null) {
            if (users.has(username)) {
                console.log("User already exists.");
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
        if (message === "/help") {
            io.emit('chat_message', '<strong>Welcome to the server!</strong>');
        } else {
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