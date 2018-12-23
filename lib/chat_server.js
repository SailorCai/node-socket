var socketio = require('socket.io');
var io;

var guestNumber = 1;
var nickName = {};
var namesUsed = {};
var currentRoom = {};

// 给用户分配 用户名逻辑
function assignGuesstName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;

    socket.emit('nameResult', {
        success: true,
        name: name
    });

    namesUsed.push(name);
    return guestNumber + 1;
};

// 用户进入聊天室相关逻辑
function joinRoom(socket, room) {
    socket.join(room);

    currentRoom[socket.id] = room;

    socket.emit('joinResult', {room: room});

    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + ' has joined ' + room + '.'
    });

    var usersInRoom = io.sockets.clients(room);

    if(usersInRoom.length > 1) {
        var usersInRoomSummary = 'Users currently in ' + room + ': ';
        for(var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;

            if(userSocketId != socket.id) {
                if(index > 0) {
                    usersInRoomSummary += ', ';
                };
                usersInRoomSummary += nickNames[userSocketId];
            };
        };
    };
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInRoomSummary});
};

// 更名请求的处理逻辑
function handleNameChangeAttempts(socket, nickName, namesUsed) {
    socket.on('nameAttempt', function(name) {
        if(name.indexOf('Guest') === 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        }else{
            if(namesUsed.indexOf(name) === -1) {
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);

                namesUsed.push(name);

                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];

                socket.emit('nameResult', {
                    success: true,
                    name: name
                });

                socket.broadcast.to(currentRoom[socket.id].emit('message', {
                    text: previousName + ' is now knows as ' + '.'
                }));
            }else{
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use.'
                });
            };
        };
    });
};

// 启动Socket.IO服务器
exports.listen = function(server) {
    io = socketio.listen(server);

    io.set('log level', 1);

    io.sockets.on('connection', function(socket) {
        guestNumber = assignGuesstName(socket, guestNumber, nickNames, namesUsed);

        joinRoom(socket, 'Lobby');

        handleMessageBroadcasting(socket, nickNames);

        handleNameChangeAttempts(socket, nickName, namesUsed);

        handleRoomJoining(socket);

        socket.on('rooms', function() {
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};

