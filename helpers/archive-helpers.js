var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var http = require('http');
var Promise = require('bluebird');

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

exports.readListOfUrls = function(callBack) {
  fs.readFile(this.paths.list, function (error, data) {
    if (error) {
      console.log('Read Error: ' + error);
      return error;
    }
    var urlArray = data.toString().split('\n');
    callBack(urlArray);
  });
};

exports.isUrlInList = function(url, callback) {
  this.readListOfUrls(function(urlArray) {
    if (urlArray.indexOf(url) >= 0) {
      callback(true);
    } else {
      callback(false);
    }
  });
};

exports.addUrlToList = function(url, callback) {
  var self = this;
  this.isUrlInList(url, function(is) {
    if (!is) {
      fs.appendFile(self.paths.list, url + '\n', callback);
    } else {
      callback();
    }
  });
};

exports.isUrlArchived = function(url, callback) {
  fs.stat(this.paths.archivedSites + '/' + url, function(error, stats) {
    if (error) {
      callback(false);
    } else {
      if (stats.isFile()) {
        callback(true);
      } else {
        callback(false);
      }
    }
  });
};

exports.downloadUrls = function(url, callback) {
  var self = this;
  url.map(function (thisUrl) {
    self.isUrlArchived(thisUrl, function(isExists) {
      if (!isExists) {
        var file = fs.createWriteStream(self.paths.archivedSites + '/' + thisUrl);
        http.get({
          host: thisUrl,
          port: 80,
          path: '/',
          method: 'GET'
        }, function(response) {
          response.pipe(file);
          callback(true);
        });

      } else {
        console.log('Site is already in archive');
      }
    });
  });
};
