var path = require('path');
var archive = require('../helpers/archive-helpers');
var fs = require('fs');
var httpHelpers = require('./http-helpers.js');
// require more modules/folders here!

exports.handleRequest = function (req, res) {
  // req.method -> GET, POST etc
  // req.url -> /, /some/path/index.url
  // http://127.0.0.1/index.html
  // req.url = '/index.html'
  // req.url = '/' -> '/index.html'

// for GET requests
  if (req.method === 'GET') { 
  // check if requested url is on our server's public folder
    if (req.url === '/index.html' || req.url === '/') {
      // if yes, serve directly from our server
      // create a readable stream from our index.html file
      var source = fs.createReadStream(archive.paths.siteAssets + '/index.html');
      // pipe the readable stream into response
      source.pipe(res);    
    }
  // if not, check if requested url is in our archive
    // if yes, serve from archive
  // if not, add requested url to list and serve 404
  }

// for POST requests
  // check if requested url is in our archive
    // if not, add it to list
  // if yes, do nothing (or show confirmation message)  

  // res.end(archive.paths.list);
};
