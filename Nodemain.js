const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((request, response) => {
  try{
    //load file (TODO: not The dumb way)
    var pathList = request.url.split('.');
    if(pathList.length > 0 && pathList[pathList.length - 1]){
      var fileType = pathList[pathList.length - 1];
      var contentType = '';
      
      switch(fileType.toLowerCase()){
        case 'html':
        case 'htm':
          console.log('html URL: [' + request.url + ']');
          contentType = 'text/html';
          break;
        case 'css':
          console.log('js URL: [' + request.url + ']');
          contentType = 'text/css';
          break;
        case 'js':
          console.log('js URL: [' + request.url + ']');
          contentType = 'application/javascript';
          break;
        case 'json':
          console.log('JSON URL: [' + request.url + ']');
          contentType = 'application/json';
          break;
        case 'xml':
          console.log('XML URL: [' + request.url + ']');
          contentType = 'application/xml';
          break;

        case 'png':
          console.log('png URL: [' + request.url + ']');
          contentType = 'image/png';
          break;
        case 'jpg':
          console.log('jpg URL: [' + request.url + ']');
          contentType = 'image/jpeg';
          break;
        case 'gif':
          console.log('gif URL: [' + request.url + ']');
          contentType = 'image/gif';
          break;
        case 'ico':
          console.log('ico URL: [' + request.url + ']');
          contentType = 'image/x-icon';
          break;

        case 'wav':
          console.log('wav URL: [' + request.url + ']');
          contentType = 'audio/wav';
          break;
        case 'flac':
          console.log('flac URL: [' + request.url + ']');
          contentType = 'audio/flac';
          break;
        case 'mp3':
          console.log('mp3 URL: [' + request.url + ']');
          contentType = 'audio/mpeg';
          break;

        //TODO any message that is not to load a file
        default:
          console.log('Unkown URL: [' + request.url + ']');
          contentType = '';

          response.statusCode = 404;
          response.setHeader('Content-Type', 'text/plain');
          response.end('Unkown URL: ' + request.url);
          return;
      }
      fs.readFile(__dirname + request.url, function (error, fileData){
        if(error){
          SendErrorResponse(error, request, response);
          return;
        }
        response.statusCode = 200;
        response.setHeader('Content-Type', contentType);
        response.end(fileData, 'utf-8');
      });
    }

  } 
  catch(exception) {
    SendErrorResponse(exception, request, response);
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

function SendErrorResponse(exception, request, response){
  response.statusCode = 404;
  response.setHeader('Content-Type', 'text/plain');
  response.end('Exception: [' + exception.message + '] URL [' + request.url + ']\n');
}