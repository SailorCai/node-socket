function divEscapedcontentElement(message) {
    return $('<div class="msg-box self"></div>').append($('<span></span>').text(message));
};

function divEscapedcontentElement2(message) {
    return $('<div></div>').text(message);
};

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
};

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();

    var systemMessage;

    if(message.charAt(0) === '/') {
        systemMessage = chatApp.processCommand(message);

        if(systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        };
    }else{
        chatApp.sendMessage($('#room').text(), message);
        $('#messages').append(divEscapedcontentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    };

    $('#send-message').val('');
};

var socket = io.connect('http://chat.ilunar.cn');

$(document).ready(function() {
    var chatApp = new Chat(socket);

    socket.on('nameResult', function(result) {
        console.log(result);
        var message;

        if(result.success) {
            message = '你当前的昵称是 ' + result.name + '.';
            chatApp.user = result.name;
        }else{
            message = result.message;
        };
        $('#messages').append(divSystemContentElement(message));;
    });

    socket.on('joinResult', function(result) {
        $('#room').text(result.room);

        $('#messages').append(divSystemContentElement('您已加入新的房间.'));
    });

    socket.on('message', function(message) {
        var newElement = $('<div class="msg-box"></div>').append($('<span></span>').text(message.text));

        $('#messages').append(newElement);
    });

    socket.on('rooms', function(rooms) {
        $('#room-wrapper').empty();

        for(var room in rooms) {
            room = room.substring(0, room.length);

            if(room != '') {
                $('#room-wrapper').append(divEscapedcontentElement2(room));
            };
        };
    });

    $('#room-wrapper').on('click', 'div', function() {
        chatApp.processCommand('/join '+ $(this).text());

        $('#send-message').focus();
    });

    setInterval(function() {
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();

    $('#send-form').submit(function(e){
        e.preventDefault();
        processUserInput(chatApp, socket);

        return false;
    })
});
