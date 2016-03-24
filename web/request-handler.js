var path = require('path');
var archive = require('../helpers/archive-helpers');
var fs = require('fs');
var qs = require('querystring');
var httpHelpers = require('./http-helpers.js');
// require more modules/folders here!

var headers = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10, // Seconds.
  'Content-Type': 'text/plain'
};

var ext2type = {
  '.html': 'text/html',
  '.css': 'text/css',
};

exports.handleRequest = function (req, res) {

  // for GET requests
  if (req.method === 'GET') { 
    var extPath = '';
    var url = req.url;

    if (url === '/') {
      url = '/index.html';
    }

    // extPath is where we expect to find the requested url in our server's public folder
    extPath = path.join(archive.paths.siteAssets, url);

    // check if the file exists in our server's public folder
    fs.stat(extPath, function (error, stats) {
      // if the file does exist in our public folder
      if (!error && stats.isFile()) { // and it is a file, not a directory
        var extname = path.extname(extPath);
        //it is a file, it should be
        res.setHeader('Content-Type', ext2type[extname]);
        // create a readable stream from our index.html file
        var source = fs.createReadStream(extPath);
        // pipe the readable stream into response
        source.pipe(res);
      } else {
        // it's not in our public folder, so check if it's in archived sites
        archive.isUrlArchivedAsync(req.url).then(function() {
          // if yes, serve from archive
          var source = fs.createReadStream(archive.paths.archivedSites + req.url);
          // pipe the readable stream into response
          source.pipe(res);  
        }).catch(function() {
          // if not, serve 404
          res.writeHead(404, headers);
          res.end('404 Not Found');  
        });
      }

    });

    // for POST requests
  } else if (req.method === 'POST') {
    // check if requested url is in our archive
    console.log('got POST req');
    console.log(req.url);
    // gather the chunks of data from the POST request, which includes a url
    var body = '';
    req.on('data', function(data) {
      body += data;

      // if the data is too large, cancel the process
      if (body.length > 1e6) {
        req.connection.destroy();
      }
    });

    req.on('end', function() {
      // turn the POST request data into an object, which includes a url property
      var postData = qs.parse(body);
      
      archive.addUrlToListAsync(postData.url).then(function() {
        archive.isUrlArchivedAsync(postData.url).then(function() {
          //redirect them to the actual page
          res.writeHead(302, {'Location': '/' + postData.url});
          res.end();
        }).catch(function() {
          //redirect them to the loading page
          res.writeHead(302, {'Location': '/loading.html'});
          res.end();
        });
      });            
    });

  } else {
    res.writeHead(404, headers);
    res.end('404 Not Found');
  }

};
