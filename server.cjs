let http = require('http');
let url = require('url');
let querystring = require('querystring');
let statics = require('node-static');

let fileServer = new statics.Server('.');

let subscribers = Object.create(null);

function onSubscribe(req, res, id) {

  res.setHeader('Content-Type', 'text/plain;charset=utf-8');
  res.setHeader("Cache-Control", "no-cache, must-revalidate");
  res.setHeader("Access-Control-Allow-Origin", "*");

  subscribers[id] = res;

  req.on('close', function() {
    delete subscribers[id];
  });

}

function publish(message, subId) {
    let res = subscribers[subId];
    res.end(message);

  // subscribers = Object.create(null);
}

function accept(req, res) {
  let urlParsed = url.parse(req.url, true);

  // new client wants messages
  if (urlParsed.pathname == '/subscribe') {
    onSubscribe(req, res, urlParsed.query.id);
    return 400;
  }

  // sending a message
  if (urlParsed.pathname == '/publish' && req.method == 'POST') {
  res.setHeader("Access-Control-Allow-Origin", "*");
    // accept POST
    req.setEncoding('utf8');
    let message = '';
    let subId = '';
    req.on('data', function(chunk) {
      subId = JSON.parse(chunk).id
      message += JSON.parse(chunk).message;
    }).on('end', function() {
      publish(message, subId); // publish it to everyone
      res.end("ok");
    });

    return;
  }

  // the rest is static
  fileServer.serve(req, res);

}

function close() {
  for (let id in subscribers) {
    let res = subscribers[id];
    res.end();
  }
}

// -----------------------------------

if (!module.parent) {
  http.createServer(accept).listen(8081);
  console.log('Server running on port 8080');
} else {
  exports.accept = accept;

  if (process.send) {
     process.on('message', (msg) => {
       if (msg === 'shutdown') {
         close();
       }
     });
  }

  process.on('SIGINT', close);
}