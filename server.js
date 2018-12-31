var http = require('http');

var fs = require('fs');

var path = require('path');

var mime = require('mime');

var cache = {};

var chatServer = require('./lib/chat_server');

// 发送404 的函数
function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});

    response.write('Error 404: 龙哥说 资源没找到');

    response.end();
};

// 提供文件数据服务的方法
function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200, 
        {'content-type': mime.getType(path.basename(filePath))}
    );
    
    response.end(fileContents);
};

function serveStatic(response, cache, absPath) {
    if(cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);
    }else{
        fs.exists(absPath, function(exists) {
            if(exists) {
                fs.readFile(absPath, function(err, data) {
                    if(err) {
                        send404(response);
                    }else{
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    };
                });
            }else{
                send404(response);
            };
            
        });
    };
};

var server = http.createServer(function(req, res){
    var filePath = false;
    console.log(req.url);
    if(req.url == '/'){
        filePath = 'public/index.html';
    }else{
        filePath = 'public' + req.url;
    };

    var absPath = './' + filePath;

    serveStatic(res, cache, absPath);
});

chatServer.listen(server);

server.listen(3001, function() {
    console.log('server listening on port 3001.');
});

