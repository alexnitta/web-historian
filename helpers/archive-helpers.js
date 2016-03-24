var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var http = require('http');
var https = require('https');
var Promise = require('bluebird');
var _url = require('url');

/*
 * You will need to reuse the same paths many times over in the course of this sprint.
 * Consider using the `paths` object below to store frequently used file paths. This way,
 * if you move any files, you'll only need to change your code in one place! Feel free to
 * customize it in any way you wish.
 */

exports.paths = {
  siteAssets: path.join(__dirname, '../web/public'),
  archivedSites: path.join(__dirname, '../archives/sites'),
  list: path.join(__dirname, '../archives/sites.txt')
};

// Used for stubbing paths for tests, do not modify
exports.initialize = function(pathsObj) {
  _.each(pathsObj, function(path, type) {
    exports.paths[type] = path;
  });
};

// The following function names are provided to you to suggest how you might
// modularize your code. Keep it clean!

exports.readListOfUrlsAsync = function() {
  var self = this;
  return new Promise(function (resolve, reject) {
    // read our sites.txt file
    fs.readFile(self.paths.list, function (error, data) {
      if (error) {
        reject(error);
      } else { // create an array with one element per line
        var urlArray = data.toString().split('\n');
        resolve(urlArray);
      }
    });
  });
};

exports.isUrlInListAsync = function(url) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.readListOfUrlsAsync().then(function(urlArray) {
      // check through array of urls in sites.txt file
      if (urlArray.indexOf(url) >= 0) { // if the site is in our list
        resolve(); // success
      } else {
        reject();
      }

    }).catch(function(error) {
      // if there is some problem reading the list, do error routine
      console.log('Error in readListOfUrlsAsync');
    });
  });
};

exports.addUrlToListAsync = function(url) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.isUrlInListAsync(url).then(function() {
      // if url is already in list, do nothing
      resolve();
    }).catch(function(error) { // if not, append to list
      fs.appendFile(self.paths.list, url + '\n', resolve);
    });
  });
};

exports.isUrlArchivedAsync = function(url) {
  var self = this;
  fs.statAsync = Promise.promisify(fs.stat);
  return new Promise(function (resolve, reject) {
    // check if file exists in archived sites folder
    fs.statAsync(self.paths.archivedSites + '/' + url).then(function() {
      resolve(); // if yes, success
    }).catch(function(error) {
      reject(); // if no, failure
    });
  });
};

exports.downloadUrlsAsync = function(urlArray) {
  var self = this;

  return new Promise(function (resolve, reject) {
    urlArray.map(function(thisUrl) { // for each url in the array
      self.isUrlArchivedAsync(thisUrl).then(function() { // if it's already archived,
        resolve(); // do nothing
      }).catch(function() { // if it's not archived yet,
        var file = fs.createWriteStream(self.paths.archivedSites + '/' + thisUrl);
        http.get({ // do an http GET request 
          host: thisUrl,
          port: 80,
          path: '/',
          method: 'GET'
        }, function(response) {

          if (response.statusCode === 301) { // if the GET request resutls in a 301,
            // create an object that contains details of the redirect url request
            var parsedUrl = _url.parse(response.headers.location);
            // if we're being redirected to the https version
            // grab that copy instead
            if (parsedUrl.protocol === 'https:') {
              https.get({
                host: parsedUrl.hostname,
                port: 443,
                path: parsedUrl.path,
                method: 'GET'
              }, function(response) {
                response.pipe(file);
                resolve();  
              });
            } else {
              //not being redirected to https version, but to another http page
              http.get({
                host: parsedUrl.hostname,
                port: 80,
                path: parsedUrl.path,
                method: 'GET'
              }, function(response) {
                response.pipe(file);
                resolve();  
              });
            }

          } else { // on successful GET request, pipe response to archived sites
            response.pipe(file);
            resolve();
          }
        });
      });
    });
  });
};
