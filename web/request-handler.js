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
        archive.isUrlArchived(req.url, function(isArchived) {
          if (isArchived) {
            // if yes, serve from archive
            var source = fs.createReadStream(archive.paths.archivedSites + req.url);
            // pipe the readable stream into response
            source.pipe(res);           
          } else {
            // if not, add requested url to list and serve 404
            archive.addUrlToList(req.url.substring(1), function() {
              // supplying a callback to addUrlToList because it expects one - actually does nothing
            });
            res.writeHead(404, headers);
            res.end('404 Not Found');
          }
        });
      }

    });

    // for POST requests
  } else if (req.method === 'POST') {
    // check if requested url is in our archive

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

      // add URL to list
      archive.addUrlToList(postData.url, function() {
        // redirect to our index.html
        // COME BACK HERE
        archive.isUrlArchived(postData.url, function(isExist) {
          if (isExist) {
            //redirect them to the actual page
            res.writeHead(302, {'Location': '/index.html'});
            res.end();
          } else {
            //redirect them to the loading page
            res.writeHead(302, {'Location': '/index.html'});
            res.end();
          }
        });
      });
    });
    
  } else {
    res.writeHead(404, headers);
    res.end('404 Not Found');
  }

};
